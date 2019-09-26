/**
 * Epitome Parallax v1.0
 * 
 * Authored by Fred Dessaint
 * www.freddessaint.com
 * @freddessaint
 *
 * Copyright 2018, Fred Dessaint
 * License: GNU General Public License, version 3 (GPL-3.0)
 * http://www.opensource.org/licenses/gpl-3.0.html
 */

(function(global, factory) {
	'use strict';
	if (typeof define == 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	}
	else {
		// Global
		var $ = global.jQuery;
		factory($);
	}

})(window, function($) {
	'use strict';

	var EpitomeParallax = window.EpitomeParallax || {};

	/**
	 * EpitomeParallax - About info.
	 *
	 * @param	Objet options - A set of options, see vars below.
	 *
	 * @var 	jQuery Object element - The target element (optional).
	 *
	 * @return	jQuery plugin.
	 */
	EpitomeParallax = (function() {
		var instanceID = 0;

		function EpitomeParallax(element, options) {
			var self = this;

			/**
			 * To save a JSON in HTML data attribute, Stringy JSON object
			 * and encode it with encodeURIComponent() method.
			 *
			 * @see Store JSON object in data attribute in HTML jQuery
			 * @link https://stackoverflow.com/questions/8542746/store-json-object-in-data-attribute-in-html-jquery
			 *
			 * @since 1.0
			 */
			var dataEncoded = getData($(element).data('epitome-parallax'), '')
			var dataOptions = safeJSONParse(decodeURIComponent(dataEncoded), [
					'param1',
					'param2',
					'param3'
				], 500) || {};

			self.instanceID = ++instanceID;
			self.settings = $.extend({
				resize: null,
				transitionHandle: null
			}, options, dataOptions);
			self.states = {
				/**
				 * @var jQuery parallaxObject - Description.
				 */
				parallaxObject: element,

				/**
				 * @var jQuery parallaxMedia - Description.
				 */
				parallaxMedia: null,

				/**
				 * @var jQuery timeout - Description.
				 */
				timeout: null,

				/**
				 * @var jQuery parentHeight - Description.
				 */
				parentHeight: 0,

				/**
				 * @var jQuery parallaxHeight - Description.
				 */
				parallaxHeight: 0,

				/**
				 * @var jQuery offsetMiddle - Description.
				 */
				offsetMiddle: 0,

				/**
				 * @var Integer offsetTop - Top offset of the parent container.
				 */
				offsetTop: 0,

				/**
				 * @var Integer speedFactor - Speed factor of layer transition.
				 */
				speedFactor: 0,
			};
			self.handlers = {
				updateTransition: null // Value set below.
			};
			self.winobj = $(window);
			self.requestAnimFrame;

			self.init();
		}

		return EpitomeParallax;
	}());

	/**
	 * Description.
	 *
	 * @since 1.0
	 */
	EpitomeParallax.prototype.init = function() {
		var self = this;

		self.setupParallaxMedia();

		if(self.states.parallaxMedia.length > 0) {
			self.setupParallaxMediaReveal();

			/**
			 * Set parallax of the background when the page is loaded.
			 *
			 * @since 1.0
			 */
			clearTimeout(self.states.timeout);
			self.states.timeout = setTimeout(function() {
				self.defineParallaxVariables();
				self.makeParallaxPosition();
				self.parallaxMediaReveal();
			}, 250);

			/**
			 * Bind a scroll event to translate the background position in the Y axis.
			 *
			 * @since 1.0
			 */
			 self.winobj.on('scroll', function() {
				self.makeParallaxPosition();
			});

			/**
			 * Bind a resize event to define values at their new positions.
			 *
			 * @since 1.0
			 */
			self.winobj.on('resize', function() {
				self.defineParallaxVariables();
				self.makeParallaxPosition();
			});
		}
	};

	/**
	 * Description.
	 *
	 * @since 1.0
	 */
	EpitomeParallax.prototype.setupParallaxMediaReveal = function() {
		var self = this;

		/**
		 * Create the toggler that does the reveal of the background.
		 *
		 * @since 1.0
		 */
		if($.isFunction($.fn.EpitomeToggle)) {
			self.states.parallaxMedia.EpitomeToggle({
				eventType: 'background-reveal'
			});
		}
	}

	/**
	 * Finds the media element where the parallax effect will be applied.
	 * The media element must contain the class name ".parallax".
	 *
	 * @since 1.0
	 */
	EpitomeParallax.prototype.setupParallaxMedia = function() {
		var self = this;

		/**
		 * Case where the ".parallax" class is immediately on the object element.
		 * Example:
		 * <div class="wp-block-cover has-parallax has-parallax-background parallax">
		 *     <p>Title</p>
		 * </div>
		 */
		if(self.states.parallaxObject.hasClass('parallax')) {
			self.states.parallaxMedia = self.states.parallaxObject;
		}

		/**
		 * Case where the class ".parallax" is on a deeper element of the structure.
		 * Example:
		 * <div class="layer has-parallax has-parallax-background">
		 *     ...
		 *     <div class="layer-media parallax">
		 *         <img> or <video> or <div>
		 *     </div>
		 *     ...
		 * </div>
		 */
		else {
			self.states.parallaxMedia = self.states.parallaxObject.find('.parallax').first();
		}

		/**
		 * Checks if transition handle exists from user settings.
		 * If no user handle exists, then checks if a class ".has-parallax-background"
		 * exists on the element to process a position-background parallax.
		 *
		 * @since 1.0
		 */
		if(self.settings.transitionHandle != null) {
			self.handlers.updateTransition = $.proxy(self.settings.transitionHandle, self);
		}
		else {
			self.handlers.updateTransition = (
				self.states.parallaxObject.hasClass('has-parallax-background') ?
				$.proxy(transitionBackground, self) :
				$.proxy(transitionElement, self)
			);
		}
	};

	/**
	 * Reveal the background when it's ready.
	 *
	 * @since 1.0
	 */
	EpitomeParallax.prototype.parallaxMediaReveal = function() {
		var self = this;

		self.states.parallaxMedia.imagesLoaded(function() {
			setTimeout(function() {
				EpitomeToggle.trigger({
					element: self.states.parallaxMedia,
					eventType: 'background-reveal'
				});
			}, 250);
		});
	};

	/**
	 * Define major parallax variables.
	 *
	 * @since 1.0
	 */
	EpitomeParallax.prototype.defineParallaxVariables = function() {
		var self = this;

		self.states.offsetTop = self.states.parallaxObject.offset().top;
		self.states.speedFactor = parseFloat(getData(self.states.parallaxObject.data('epitome-parallax-speed'), '0.2'));
		self.states.parentHeight = self.states.parallaxObject.outerHeight();
		self.states.parallaxHeight = self.states.parallaxMedia.outerHeight();

		/**
		 * Speed is a factor between 0 and 1.
		 * 0 - Looks like static.
		 * 1 - Looks like fixed.
		 */
		if(self.states.speedFactor < 0 & self.states.speedFactor > 1) {
			self.states.speedFactor = 0.2;
		}

		var parallaxOffset = new String(getData(self.states.parallaxObject.data('epitome-parallax-offset'), '50%'));
		var regexp_offset = new RegExp(/(\d+)(px|%)*/);

		/**
		 * Incorrect offset syntax is changed with 0px as default.
		 *
		 * @since 1.0
		 */
		if(!regexp_offset.test(parallaxOffset)) {
			parallaxOffset = '50%';
		}

		/**
		 * Extract items of the offset.
		 * The offset variable is string, so use parseInt()
		 * to compute numeric expressions.
		 *
		 * @since 1.0
		 */
		var matches = parallaxOffset.match(regexp_offset);
		var horizontalOffset = matches[1];
		var unit = matches[2];

		if('px' == unit) {
			self.states.offsetMiddle = parseInt(horizontalOffset);
		}
		else if('%' == unit) {
			self.states.offsetMiddle = Math.round((self.states.parallaxHeight - self.states.parentHeight) * (parseInt(horizontalOffset) / 100));
		}
		else if(undefined == unit) {
			self.states.offsetMiddle = parseInt(horizontalOffset);
		}
	};

	/**
	 * Request the current position of the parallax.
	 *
	 * @since 1.0
	 */
	EpitomeParallax.prototype.makeParallaxPosition = function() {
		var self = this;

		// if(parallaxObject.is(':in-viewport')) {
		if(self.states.parallaxObject.isInViewport()) {
			/**
			 * Callback transitionHandle.
			 * User function for processing things *during* the parallax change.
			 *
			 * @since 1.0
			 */
			requestAnimFrame(self.handlers.updateTransition);
		}
	};

	EpitomeParallax.prototype.getInstance = function() {
		return this;
	}

	$.fn.EpitomeParallax = function() {
		var self = this,
			scope = arguments[0],
			args = Array.prototype.slice.call(arguments, 1),
			returnValue;

		$(self).each(function(i) {
			if (typeof scope == 'object' || typeof scope == 'undefined') {
				self[i].instance = new EpitomeParallax($(this), scope);
				returnValue = self;
			}
			else {
				if(self[i].instance.methodHandlers.hasOwnProperty(scope)) {
					returnValue = self[i].instance.methodHandlers[scope].apply(self[i].instance, args);
				}
				else {
					throw new Error("User callback does not exists: " + scope);
				}
			}

			if (typeof returnValue != 'undefined') {
				return returnValue;
			}
		});

		return returnValue;
	};

	/**
	 * Modern browsers try to refresh the content on screen in sync with
	 * a device's refresh rate. For most devices today, the screen will
	 * refresh 60 times a second, or 60Hz. If there is some motion on screen
	 * (such as scrolling, transitions, or animations) a browser should
	 * create 60 frames per second to match the refresh rate.
	 *
	 * @link http://jankfree.org/
	 */
	var requestAnimFrame = (
		window.requestAnimationFrame       ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function(callback) {
			setTimeout(callback, 1000 / 60);
		}
	);

	/**
	 * Get data from an attibute if it exists or a default value if not exists.
	 *
	 * @since 1.0
	 */
	var getData = function(attr, defaultValue) {
		return ((typeof attr !== typeof undefined && attr !== false) ? attr : defaultValue);
	};

	/**
	 * A parsing function that expects an object with properties that applies
	 * some of these checks and gives you a filtered result that only contains
	 * the properties you were expecting.
	 *
	 * @see Is sanitizing JSON necessary?
	 * @link https://stackoverflow.com/questions/25983090/is-sanitizing-json-necessary
	 *
	 * @var Sting str - JSON encoded input string.
	 * @var Array propArray - The properties you were expecting only.
	 * @var Integer maxLen - Sanitize the length of data.
	 *
	 *
	 * @since 1.0
	 */
	var safeJSONParse = function(str, propArray, maxLen) {
		var parsedObj, safeObj = {};

		try {
			if(!str || str.length == 0) {
				return null;
			}
			else if (maxLen && str.length > maxLen) {
				return null;
			}
			else {
				parsedObj = JSON.parse(str);

				if (typeof parsedObj !== 'object' || Array.isArray(parsedObj)) {
					safeObj = parsedObj;
				}
				else {
					propArray.forEach(function(prop) {
						if (parsedObj.hasOwnProperty(prop)) {
							safeObj[prop] = parsedObj[prop];
						}
					});
				}
				return safeObj;
			}
		} catch(e) {
			console.log('str:'+str);
			console.log('propArray:'+propArray);
			console.log('maxLen:'+maxLen);
			console.error('EpitomeParallax.safeJSONParse:', e.message);
			return null;
		}
	};

	/**
	 * Calculate and apply the current parallax position
	 * to the media as a background image.
	 *
	 * @since 1.0
	 */
	var transitionBackground = function() {
		var self = this;

		var scrollTop = self.winobj.scrollTop();
		var diff = scrollTop - self.states.offsetTop;
		var offsetPosition = Math.round(diff * self.states.speedFactor) - self.states.offsetMiddle;
		var translate = 'calc(50% + ' + offsetPosition + 'px)';
		self.states.parallaxMedia.css({ backgroundPositionY: translate });
	};

	/**
	 * Calculate and apply the current parallax position.
	 * to the media as a block element.
	 *
	 * @since 1.0
	 */
	var transitionElement = function() {
		var self = this;

		var scrollTop = self.winobj.scrollTop();
		var diff = scrollTop - self.states.offsetTop;
		var offsetPosition = Math.round(diff * self.states.speedFactor) - self.states.offsetMiddle;
		var translate = 'translate3d(0, ' + offsetPosition + 'px, 0)';
		self.states.parallaxMedia.css({ transform: translate });
	};

});
