/*
 * Catalog and studio cut-outs. Fallback catalog, taken from mkurugenzi.ke on 30 Sep 2026.
 * Used only when WooCommerce data is not available (shortcode source="static",
 * or the stand-alone preview). On the live site the plugin reads products,
 * prices, sizes and stock straight from WooCommerce, so this file never needs
 * editing there.
 */
(function () {
  var U = 'https://mkurugenzi.ke/wp-content/uploads/';
  var SEARCH = 'https://mkurugenzi.ke/?post_type=product&s=';
  var KEYS = {"T-Shirt – Makosa Ni Yangu": "tee-makosa", "T-Shirt – Black Excellence": "tee-black", "T-Shirt – White Luxe": "tee-white", "T-Shirt – Desert Sand": "tee-sand", "T-Shirt – Desert Taupe": "tee-taupe", "T-Shirt – Faded Navy": "tee-navy", "T-Shirt – Burgundy Bliss": "tee-burgundy", "Hoodie – Black Excellence": "hoodie-black", "Quarter Zip – Desert Sand": "qzip-sand", "Quarter Zip – Black Excellence": "qzip-black", "Jacket – Black Icon": "jacket-black", "Sweatsuit – Black Excellence": "suit-black", "Sweatsuit – Ivory Essence": "suit-ivory", "Sweatsuit – Coffee Brown": "suit-coffee", "Sweatsuit – Gray Snow Wash": "suit-grey", "Sweatsuit – Beige Snow Wash": "suit-beige", "Ladies Sweatsuit – Soft Grey": "ladies-grey", "Ladies Sweatsuit – Black Excellence": "ladies-black", "Ladies Sweatsuit – Burgundy Bliss": "ladies-burgundy", "Sweat Pants – Jungle": "pants-jungle", "Sweat Pants – Jungle Green Snow Wash": "pants-jungle-snow", "Sweat Pants – Grey Snow Wash": "pants-grey", "Sweat Pants – Beige Snow Wash": "pants-beige", "Beanie Hat – Navy Blue": "beanie-navy", "Beanie Hat – Grey": "beanie-grey", "Beanie Hat – Beige": "beanie-beige", "Tote Bag – White": "tote-white", "Tote Bag – Black": "tote-black", "Socks – A Pack Of 3": "socks"};
  function p(name, price, image, regular) {
    return {
      key: KEYS[name] || '',
      name: name,
      price: price,
      regular: regular || price,
      image: image ? U + image : '',
      url: SEARCH + encodeURIComponent(name.split(' – ')[1] || name),
      inStock: true
    };
  }
  /* Studio cut-outs of every piece on its hanger (front view, plus 'side:' views for the rail), packed into one image sheet: [x, y, width, height] */
  window.MKR_ATLAS = {"w": 4096, "h": 2920, "items": {"suit-black": [8, 8, 351, 820], "suit-ivory": [367, 8, 351, 820], "suit-coffee": [726, 8, 350, 820], "suit-grey": [1084, 8, 349, 820], "suit-beige": [1441, 8, 343, 820], "ladies-grey": [1792, 8, 328, 820], "ladies-black": [2128, 8, 348, 820], "ladies-burgundy": [2484, 8, 333, 820], "side:suit-black": [2825, 8, 134, 820], "side:suit-ivory": [2967, 8, 141, 820], "side:suit-coffee": [3116, 8, 133, 820], "side:suit-grey": [3257, 8, 136, 820], "side:suit-beige": [3401, 8, 141, 820], "side:ladies-grey": [3550, 8, 135, 820], "side:ladies-black": [3693, 8, 139, 820], "side:ladies-burgundy": [3840, 8, 138, 820], "pants-jungle": [8, 836, 340, 780], "pants-jungle-snow": [356, 836, 342, 780], "pants-grey": [706, 836, 358, 780], "pants-beige": [1072, 836, 335, 780], "side:pants-jungle": [1415, 836, 127, 780], "side:pants-jungle-snow": [1550, 836, 123, 780], "side:pants-grey": [1681, 836, 129, 780], "side:pants-beige": [1818, 836, 130, 780], "qzip-sand": [1956, 836, 531, 660], "qzip-black": [2495, 836, 521, 660], "jacket-black": [3024, 836, 536, 660], "side:qzip-sand": [3568, 836, 106, 660], "side:qzip-black": [3682, 836, 109, 660], "side:jacket-black": [3799, 836, 123, 660], "tee-black": [8, 1624, 506, 640], "tee-makosa": [522, 1624, 499, 640], "tee-white": [1029, 1624, 501, 640], "tee-burgundy": [1538, 1624, 511, 640], "tee-sand": [2057, 1624, 426, 640], "tee-taupe": [2491, 1624, 424, 640], "tee-navy": [2923, 1624, 415, 640], "hoodie-black": [3346, 1624, 470, 640], "side:tee-black": [3824, 1624, 121, 640], "side:tee-makosa": [3953, 1624, 117, 640], "side:tee-white": [8, 2272, 117, 640], "side:tee-burgundy": [133, 2272, 118, 640], "side:tee-sand": [259, 2272, 112, 640], "side:tee-taupe": [379, 2272, 111, 640], "side:tee-navy": [498, 2272, 118, 640], "side:hoodie-black": [624, 2272, 186, 640], "beanie-navy": [818, 2272, 387, 420], "beanie-grey": [1213, 2272, 379, 420], "beanie-beige": [1600, 2272, 386, 420], "tote-white": [1994, 2272, 213, 420], "tote-black": [2215, 2272, 296, 420], "socks": [2519, 2272, 267, 420]}, "url": "https://d2ol7oe51mr4n9.cloudfront.net/user_3J10z5e8feQnKs6nWKt856Ecc0m/0a0469ef-90f0-4b92-962e-01a62b985629.webp"};

  window.MKR_FALLBACK_PRODUCTS = [
    p('T-Shirt – Makosa Ni Yangu', 1500, '2026/02/blacktshirt_79fe47d5-b4c9-4742-b593-2fa0f86024e8-819x1024.webp'),
    p('T-Shirt – Black Excellence', 1500, '2026/01/black-tshirt-2-819x1024.webp'),
    p('T-Shirt – White Luxe', 1500, '2026/01/White-tshirt-819x1024.webp'),
    p('T-Shirt – Desert Sand', 1500, '2026/01/Beige-Tshirt-819x1024.webp'),
    p('T-Shirt – Desert Taupe', 1500, '2026/01/Desert-Taupe-Tshirt-819x1024.webp'),
    p('T-Shirt – Faded Navy', 1500, '2026/01/tshirt-navy-bluer-1-819x1024.webp'),
    p('T-Shirt – Burgundy Bliss', 1500, '2026/01/Burgundy-Tshirt-819x1024.webp'),

    p('Hoodie – Black Excellence', 3000, '2026/01/BlackHoodie-819x1024.webp'),
    p('Quarter Zip – Desert Sand', 2500, '2026/08/237-1-550x660.jpg'),
    p('Quarter Zip – Black Excellence', 2500, '2026/08/122-1-1-550x660.jpg'),
    p('Jacket – Black Icon', 3500, '2026/08/458-550x660.jpg'),

    p('Sweatsuit – Black Excellence', 6500, '2026/08/290-550x660.jpg'),
    p('Sweatsuit – Ivory Essence', 6500, '2026/08/342-550x660.jpg'),
    p('Sweatsuit – Coffee Brown', 6500, '2026/08/309-550x660.jpg'),
    p('Sweatsuit – Gray Snow Wash', 6500, '2026/02/MkurugenziSweatSuits-550x660.webp'),
    p('Sweatsuit – Beige Snow Wash', 6500, '2026/02/MkurugenziSweatSuits2-550x660.webp'),
    p('Ladies Sweatsuit – Soft Grey', 6750, '2026/08/395-550x660.jpg'),
    p('Ladies Sweatsuit – Black Excellence', 6750, '2026/08/512-550x660.jpg'),
    p('Ladies Sweatsuit – Burgundy Bliss', 6750, '2026/08/476-550x660.jpg'),

    p('Sweat Pants – Jungle', 2500, '2026/02/men-jungle-sweatpant-1-819x1024.png', 3500),
    p('Sweat Pants – Jungle Green Snow Wash', 2500, '2026/02/UnisexBottomJ.Green_-550x660.jpg', 3500),
    p('Sweat Pants – Grey Snow Wash', 3500, '2026/02/ladies-grey-sweatpant-1-550x660.png'),
    p('Sweat Pants – Beige Snow Wash', 3500, '2026/02/ladies-beige-sweatpant-1-550x660.png'),

    p('Beanie Hat – Navy Blue', 900, '2026/02/Beanieblue.webp'),
    p('Beanie Hat – Grey', 900, '2026/01/Beaniegrey_52731fef-a4c2-4a8e-8bb6-eb5cc14d51e4.webp'),
    p('Beanie Hat – Beige', 900, '2026/01/Beaniebeige.webp'),

    p('Tote Bag – White', 850, '2026/01/white-tote-bag-e1768471281980-550x660.webp'),
    p('Tote Bag – Black', 2500, '2026/02/Tote-Resized.png'),
    p('Socks – A Pack Of 3', 1000, '2026/09/87047815-30b6-46c8-881f-30520e5d72ea-1-550x660.png')
  ];
})();
