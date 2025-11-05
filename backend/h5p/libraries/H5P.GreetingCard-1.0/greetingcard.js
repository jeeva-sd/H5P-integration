var H5P = H5P || {};

H5P.GreetingCard = (function ($) {
  'use strict';

  /**
   * Constructor function.
   */
  function C(options, contentId) {
    this.$ = $(this);
    // Extend defaults with provided options
    this.options = $.extend(true, {}, {
      greeting: 'Hello world!'
    }, options);
    // Keep provided id.
    this.contentId = contentId;
  }

  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    $container.addClass('h5p-greeting-card');
    $container.html('<div class="greeting-card-wrapper"><h2>' + this.options.greeting + '</h2></div>');
  };

  return C;
})(H5P.jQuery);