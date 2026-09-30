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
  /* Studio cut-outs of every piece on its hanger, packed into one image sheet: [x, y, width, height] */
  window.MKR_ATLAS = {"w": 4096, "h": 2272, "items": {"suit-black": [8, 8, 351, 820], "suit-ivory": [367, 8, 351, 820], "suit-coffee": [726, 8, 350, 820], "suit-grey": [1084, 8, 349, 820], "suit-beige": [1441, 8, 343, 820], "ladies-grey": [1792, 8, 328, 820], "ladies-black": [2128, 8, 348, 820], "ladies-burgundy": [2484, 8, 333, 820], "pants-jungle": [2825, 8, 340, 780], "pants-jungle-snow": [3173, 8, 342, 780], "pants-grey": [3523, 8, 358, 780], "pants-beige": [8, 836, 335, 780], "qzip-sand": [351, 836, 531, 660], "qzip-black": [890, 836, 521, 660], "jacket-black": [1419, 836, 536, 660], "tee-black": [1963, 836, 506, 640], "tee-makosa": [2477, 836, 499, 640], "tee-white": [2984, 836, 501, 640], "tee-burgundy": [3493, 836, 511, 640], "tee-sand": [8, 1624, 426, 640], "tee-taupe": [442, 1624, 424, 640], "tee-navy": [874, 1624, 415, 640], "hoodie-black": [1297, 1624, 470, 640], "beanie-navy": [1775, 1624, 387, 420], "beanie-grey": [2170, 1624, 379, 420], "beanie-beige": [2557, 1624, 386, 420], "tote-white": [2951, 1624, 213, 420], "tote-black": [3172, 1624, 296, 420], "socks": [3476, 1624, 267, 420]}, "url": "https://d2ol7oe51mr4n9.cloudfront.net/user_3J10z5e8feQnKs6nWKt856Ecc0m/4b5d7eac-4560-4887-a292-fbee2182d89e.webp"};

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
