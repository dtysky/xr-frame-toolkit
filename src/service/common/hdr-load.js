'use strict';

var stream = require('stream');
var util = require('util');
var floatUtils = require('mmme-encoding');
var xyzUtils = require('xyz-utils');

module.exports = HDRLoader;

var MINLEN = 8;
var MAXLEN = 0x7fff;
var HEADER_REGEX = /([\#\?]+)?([^=\n\r]+)?=?([^=\n\r]*)?([\n\r]+)/gi;
var DIMENSION_REGEX = /^([+\-])([XY])\s(\d+)\s([+\-])([XY])\s(\d+)/i;
var HEADER_PREFIXES = {
	'#?': 'FILETYPE',
	'#': 'COMMENT',
	'undefined': 'HEADER'
};
var DEFAULT_HEADERS = {
	'EXPOSURE': 1,
	'COLORCORR': [1, 1, 1],
	'PIXASPECT': 1,
	'PRIMARIES': [0.640, 0.330, 0.290, 0.600, 0.150, 0.060, 0.333, 0.333]
};
var X = 0;
var Y = 1;
var Z = 2;
var E = 3;

function HDRLoader (options) {
	if (!options) options = {};
	if (!options.highWaterMark) options.highWaterMark = 262144;

	stream.Writable.call(this, options);

	this.headers = {};
	this.comments = [];
	this.data = null;
	this.width = -1;
	this.height = -1;

	this._lastChunk = null;
	this._headerFinished = false;
	this._error = false;
	this._row_major = true;
	this._scanlineSize = -1;
	this._isRGBE = true;
	this._hasExposure = false;
	this._exposureVals = [1, 1, 1];
}

util.inherits(HDRLoader, stream.Writable);

HDRLoader.prototype._write = function (chunk, encoding, next) {
	if (this._error) {
		return next();
	}

	if (this._lastChunk) {
		this._lastChunk = Buffer.concat([this._lastChunk, chunk]);
	} else {
		this._lastChunk = chunk;
	}

	if (!this._headerFinished) {
		this._readHeader(this._lastChunk, encoding);
		return next();
	}

	while (this._lastChunk.length >= this._scanlineSize) {
		this._readScanline(this._lastChunk);
	}

	this._copyRemainingBuffer(this._lastChunk, 0)

	return next();
}

HDRLoader.prototype.end = function (chunk, encoding) {
	if (this._error) {
		return;
	}

	if (chunk) {
		if (this._lastChunk) {
			this._lastChunk = Buffer.concat([this._lastChunk, chunk]);
		} else {
			this._lastChunk = chunk;
		}
	}

	if (this._lastChunk) {
		if (!this._headerFinished) {
			this._readHeader(this._lastChunk, encoding);
		}

		while (this._lastChunk.length > 0) {
			this._readScanline(this._lastChunk);
		}
	}

	this._finished();
}

HDRLoader.prototype._finished = function () {
	this.emit('load', this);
}

HDRLoader.prototype._readScanline = function (chunk) {
	var firstPixel = [],
	    scanline;

	firstPixel[X] = chunk.readUInt8(X);
	firstPixel[Y] = chunk.readUInt8(Y);
	firstPixel[Z] = chunk.readUInt8(Z);
	firstPixel[E] = chunk.readUInt8(E);

	if (this._isOldRLE(firstPixel)) {
		scanline = this._readOldRLE(chunk);
	} else {
		if ((firstPixel[Z] << 8 | firstPixel[E]) !== this._getScanlinePixels()) {
			this._lastChunk = null;
			this.data = null;
			console.log(this, chunk)
			this._error = true;
			this.emit('error');
			return;
		}

		scanline = this._readNewRLE(chunk.slice(4))
	}

	this._processScanline(scanline);
}

HDRLoader.prototype._processScanline = function (scanline) {
	var tempValues;
	var tempFloats = new Float32Array(3);
	var tempXYZ;

	if (this._row_major) {
		for (var i = this._start_x; i !== this._end_x; i += this._inc_x) {
			tempValues = scanline.shift();
			floatUtils.toFloats(tempValues, tempFloats);
			tempXYZ = this._processPixel(tempFloats);
			this._writePixel(i, this._current_y, tempXYZ);
		}
		this._current_y += this._inc_y;
	} else {
		for (var i = this._start_y; i !== this._end_y; i += this._inc_y) {
			tempValues = scanline.shift();
			floatUtils.toFloats(tempValues, tempFloats);
			tempXYZ = this._processPixel(tempFloats);
			this._writePixel(this._current_x, i, tempXYZ);
		}
		this._current_x += this._inc_x;
	}
}

HDRLoader.prototype._readOldRLE = function (chunk) {
	var scanline = [],
	    len = this._getScanlinePixels(),
	    offset = 0,
	    writePos = 0,
	    i, rshift = 0;

	while (len > 0) {
		scanline[writePos] = [];
		scanline[writePos][X] = chunk.readUInt8(offset++);
		scanline[writePos][Y] = chunk.readUInt8(offset++);
		scanline[writePos][Z] = chunk.readUInt8(offset++);
		scanline[writePos][E] = chunk.readUInt8(offset++);

		if (scanline[writePos][X] === 1
			&& scanline[writePos][Y] === 1
			&& scanline[writePos][Z] === 1) {
			for (i = scanline[writePos][E] << rshift; i > 0; i--) {
				scanline[writePos] = [];
				scanline[writePos][X] = scanline[writePos - 1][X];
				scanline[writePos][Y] = scanline[writePos - 1][Y];
				scanline[writePos][X] = scanline[writePos - 1][Z];
				scanline[writePos][E] = scanline[writePos - 1][E];
				writePos++;
				len--;
			}
			rshift += 8;
		}
		else {
			writePos++;
			len--;
			rshift = 0;
		}
	}

	this._trimRemainingBuffer(chunk, offset);
	return scanline;
}

HDRLoader.prototype._readNewRLE = function (chunk) {
	var scanline = [],
	    offset = 0;

	for (var i = 0; i < 4; i++) {
		for (var j = 0; j < this._getScanlinePixels(); ) {
			var code = chunk.readUInt8(offset++);
			if (code > 128) { // run
				code &= 127;
				var val = chunk.readUInt8(offset++);
				while (code--) {
					if (scanline[j] == null) scanline[j] = [];
					scanline[j++][i] = val;
				}
			} else { // non-run
				while (code--) {
					if (scanline[j] == null) scanline[j] = [];
					scanline[j++][i] = chunk.readUInt8(offset++);
				}
			}
		}
	}

	this._trimRemainingBuffer(chunk, offset);
	return scanline;
}

HDRLoader.prototype._copyRemainingBuffer = function (chunk, consumed) {
	var remainingLen = chunk.length - consumed;

	this._lastChunk = new Buffer(remainingLen);

	chunk.copy(this._lastChunk, 0, consumed);
}

HDRLoader.prototype._trimRemainingBuffer = function (chunk, consumed) {
	this._lastChunk = chunk.slice(consumed);
}

HDRLoader.prototype._processPixel = function (pixelData) {
	var XYZ = pixelData;

	// First adjust the pixel data according to exposure settings
	pixelData[0] /= this._exposureVals[0];
	pixelData[1] /= this._exposureVals[1];
	pixelData[2] /= this._exposureVals[2];

	// If the pixel format is RGB we convert to XYZ because of the high
	// likelyhood that any further HDR processing will be done in XYZ
	// or a similar color space and XYZ offers the best intermediate for
	// conversion between colorspaces
	if (this._isRGBE) {
		// TODO:  Use white point for conversion if supplied in headers
		XYZ = xyzUtils.fromRGB(pixelData);
	}

	return XYZ;
}

HDRLoader.prototype._writePixel = function (x, y, pixelData) {
	var offset = (x + y * this.width) * 3;

	this.data[offset++] = pixelData[X];
	this.data[offset++] = pixelData[Y];
	this.data[offset++] = pixelData[Z];
}

HDRLoader.prototype._readHeader = function (chunk) {
	var str = chunk.toString('ascii'),
	    sliceOffset = 0,
	    headerData;

	HEADER_REGEX.lastIndex = 0;
	while (headerData = HEADER_REGEX.exec(str)) {
		sliceOffset += headerData[0].length;
		if (DIMENSION_REGEX.test(headerData[2])) {
			// Parse size header
			this._readSizeHeader(headerData[2]);

			if (!this.headers['RADIANCE']
				|| this.width <= 0
				|| this.height <= 0) {
				this.data = null;
				this._error = true;
				this.emit('error');
			}

			this._headerFinished = true;

			if (this._hasExposure) {
				if (this.headers['EXPOSURE']) {
					var t = this.headers['EXPOSURE'];
					this._exposureVals = [t, t, t];
				}
				if (this.headers['COLORCORR']) {
					var t = this.headers['COLORCORR'];
					this._exposureVals[0] *= t[0];
					this._exposureVals[1] *= t[1];
					this._exposureVals[2] *= t[2];
				}
			}

			break;
		} else {
			console.log('hdr readheader', HEADER_PREFIXES, headerData[1], headerData[2], headerData[3])
			switch (HEADER_PREFIXES[String(headerData[1])]) {
				case 'FILETYPE':
					if (headerData[2] === 'RADIANCE' || headerData[2] === 'RGBE') {
						this.headers['RADIANCE'] = true;
					}
					break;
				case 'HEADER':
					this.headers[headerData[2]] = this._processHeader(headerData[2], headerData[3]);
					break;
				case 'COMMENT':
					this.comments.push(headerData[2]);
					break;
				default:
					// Must be a parse error
					this._error = true;
					this.emit('error');
			}
		}
	}

	this._trimRemainingBuffer(chunk, sliceOffset);
}

// We only attempt to parse the most common headers
HDRLoader.prototype._processHeader = function (headerName, headerValue) {
	switch (headerName.toUpperCase()) {
		case 'EXPOSURE':
			this._hasExposure = true;
		case 'PIXASPECT':
			var val = parseFloat(headerValue);
			return this.headers[headerName] ? this.headers[headerName] * val : val;
		case 'PRIMARIES':
			var vals = headerValue.split(/\s+/);
			return vals.map(parseFloat);
		case 'COLORCORR':
			this._hasExposure = true;
			var vals = headerValue.split(/\s+/);
			vals = vals.map(parseFloat);
			return this.headers[headerName] ? this.headers[headerName].map(mults(vals)) : vals;
		case 'FORMAT':
			if (headerValue === '32-bit_rle_rgbe') {
				this._isRGBE = true;
				return 'RGBE';
			} else if (headerValue === '32-bit_rle_xyze') {
				this._isRGBE = false;
				return 'XYZE';
			} else {
				// Must be a parse error
				this._error = true;
				this.emit('error');
			}
		default:
			return headerValue;
	}
}

HDRLoader.prototype._isOldRLE = function (pixel) {
	var len = this._getScanlinePixels();

	if (len < MINLEN || len > MAXLEN) return true;

	if (pixel[X] !== 2) return true;

	if (pixel[Y] !== 2 || pixel[Z] & 128) return true;

	return false;
}

HDRLoader.prototype._getScanlinePixels = function() {
	if (this._row_major) {
		return this.width;
	} else {
		return this.height;
	}
}

HDRLoader.prototype._readSizeHeader = function(header) {
	var sizeData = header.match(DIMENSION_REGEX);

	if (sizeData[2].toLowerCase() === "y") {
		this._row_major = true;

		this.height = +sizeData[3];
		if (sizeData[1] === '-') {
			this._start_y = 0;
			this._end_y = this.height;
			this._inc_y = 1;
			this._current_y = this._start_y;
		} else {
			this._start_y = this.height - 1;
			this._end_y = -1;
			this._inc_y = -1;
			this._current_y = this._start_y;
		}

		this.width = +sizeData[6];
		if (sizeData[4] === '-') {
			this._start_x = this.width - 1;
			this._end_x = -1;
			this._inc_x = -1;
			this._current_x = this._start_x;
		} else {
			this._start_x = 0;
			this._end_x = this.width;
			this._inc_x = 1;
			this._current_x = this._start_x;
		}
	} else {
		this._row_major = false;

		this.width = +sizeData[3];
		if (sizeData[1] === '-') {
			this._start_x = 0;
			this._end_x = this.width;
			this._inc_x = 1;
			this._current_y = this._start_y;
		} else {
			this._start_x = this.width - 1;
			this._end_x = -1;
			this._inc_x = -1;
			this._current_x = this._start_x;
		}

		this.height = +sizeData[6];
		if (sizeData[4] === '-') {
			this._start_y = this.height - 1;
			this._end_y = -1;
			this._inc_y = -1;
			this._current_y = this._start_y;
		} else {
			this._start_y = 0;
			this._end_y = this.height;
			this._inc_y = 1;
			this._current_x = this._start_x;
		}
	}

	this._allocateData();
	this._scanlineSize = this._getScanlinePixels() * 4 + 4; // Number of pixels + possible special pixel at beginning
}

HDRLoader.prototype._allocateData = function () {
	this.data = new Float32Array(this.width * this.height * 3);
}

function mults (m) {
	return function (v, i) {
		return m[i] * v;
	};
}
