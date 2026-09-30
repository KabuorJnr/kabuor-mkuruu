<?php
/**
 * Plugin Name:       Mkurugenzi
 * Description:       An interactive clothing-rack showcase for WooCommerce products. Add the shortcode [mkurugenzi] to any page.
 * Version:           2.2.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            GovTech Builders KE
 * License:           GPL-2.0-or-later
 * Text Domain:       mkurugenzi
 *
 * Privacy: this plugin sets no cookies, stores nothing in the browser,
 * loads no third-party scripts or fonts, and collects no personal data.
 * Purchases go through the store's existing WooCommerce cart and checkout.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MKR_VERSION', '2.2.0' );
define( 'MKR_URL', plugin_dir_url( __FILE__ ) );

/**
 * Register assets. They are only enqueued on pages that use the shortcode.
 */
function mkr_register_assets() {
	wp_register_style( 'mkurugenzi', MKR_URL . 'assets/rack.css', array(), MKR_VERSION );
	wp_register_script( 'mkurugenzi-products', MKR_URL . 'assets/products.js', array(), MKR_VERSION, true );
	wp_register_script( 'mkurugenzi-cart', MKR_URL . 'assets/cart.js', array(), MKR_VERSION, true );
	wp_register_script( 'mkurugenzi', MKR_URL . 'assets/rack.js', array( 'mkurugenzi-products', 'mkurugenzi-cart' ), MKR_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'mkr_register_assets' );

/**
 * Readable label for a variation attribute value (term name for taxonomy attributes).
 */
function mkr_attribute_label( $attribute_key, $value ) {
	$taxonomy = str_replace( 'attribute_', '', $attribute_key );
	if ( taxonomy_exists( $taxonomy ) ) {
		$term = get_term_by( 'slug', $value, $taxonomy );
		if ( $term && ! is_wp_error( $term ) ) {
			return $term->name;
		}
	}
	return $value;
}

/**
 * Build the product feed from WooCommerce.
 */
function mkr_products_from_woocommerce( $atts ) {
	$args = array(
		'status'  => 'publish',
		'limit'   => max( 1, min( 200, intval( $atts['limit'] ) ) ),
		'orderby' => 'menu_order',
		'order'   => 'ASC',
		'visibility' => 'catalog',
	);
	if ( ! empty( $atts['category'] ) ) {
		$args['category'] = array_map( 'sanitize_title', array_map( 'trim', explode( ',', $atts['category'] ) ) );
	}
	if ( 'yes' === $atts['hide_out_of_stock'] ) {
		$args['stock_status'] = 'instock';
	}

	$items = array();
	foreach ( wc_get_products( $args ) as $product ) {
		$image_id = $product->get_image_id();
		$image    = $image_id ? wp_get_attachment_image_url( $image_id, 'woocommerce_single' ) : '';

		$regular = $product->is_type( 'variable' ) ? $product->get_variation_regular_price( 'min' ) : $product->get_regular_price();

		$variations = array();
		$sizes      = array();
		if ( $product->is_type( 'variable' ) ) {
			foreach ( $product->get_available_variations( 'objects' ) as $variation ) {
				$attrs = $variation->get_variation_attributes( true );
				$label = array();
				foreach ( $attrs as $key => $value ) {
					if ( '' === $value ) {
						continue;
					}
					$label[] = mkr_attribute_label( $key, $value );
				}
				$label = implode( ' / ', $label );
				if ( '' === $label ) {
					continue;
				}
				$variations[] = array(
					'id'      => $variation->get_id(),
					'label'   => $label,
					'inStock' => $variation->is_in_stock() && $variation->is_purchasable(),
					'price'   => (float) $variation->get_price(),
				);
				$sizes[] = $label;
			}
		}

		$items[] = array(
			'id'          => $product->get_id(),
			'name'        => html_entity_decode( wp_strip_all_tags( $product->get_name() ), ENT_QUOTES, 'UTF-8' ),
			'price'       => (float) $product->get_price(),
			'regular'     => (float) $regular,
			'url'         => get_permalink( $product->get_id() ),
			'image'       => $image ? $image : '',
			'productType' => $product->get_type(),
			'inStock'     => $product->is_in_stock(),
			'purchasable' => $product->is_purchasable(),
			'variations'  => $variations,
			'sizes'       => array_values( array_unique( $sizes ) ),
		);
	}
	return $items;
}

/**
 * Settings for the bag and checkout panel. It talks to the WooCommerce Store API,
 * and payment is completed by whichever gateway the store has switched on.
 */
function mkr_cart_config( $atts ) {
	$gateways = array();
	if ( function_exists( 'WC' ) && WC()->payment_gateways() ) {
		foreach ( WC()->payment_gateways()->get_available_payment_gateways() as $id => $gateway ) {
			$gateways[] = array(
				'id'          => $id,
				'title'       => wp_strip_all_tags( $gateway->get_title() ),
				'description' => wp_strip_all_tags( $gateway->get_description() ),
			);
		}
	}
	$terms_id = function_exists( 'wc_terms_and_conditions_page_id' ) ? wc_terms_and_conditions_page_id() : 0;
	return array(
		'storeApi'    => esc_url_raw( rest_url( 'wc/store/v1/' ) ),
		'nonce'       => wp_create_nonce( 'wc_store_api' ),
		'checkoutUrl' => wc_get_checkout_url(),
		'gateways'    => $gateways,
		'termsUrl'    => $terms_id ? get_permalink( $terms_id ) : '',
		'privacyUrl'  => get_privacy_policy_url(),
		'refundUrl'   => esc_url_raw( $atts['refund_url'] ),
		'deleteUrl'   => esc_url_raw( $atts['delete_url'] ),
	);
}

/**
 * Shortcode: [mkurugenzi]  (the older [mkurugenzi_rack] still works)
 *
 * Attributes:
 *   category           Comma separated WooCommerce category slugs to include (default: all).
 *   limit              Max products (default 60).
 *   hide_out_of_stock  yes|no (default no; out of stock pieces still hang, marked "Sold out").
 *   title              Heading shown above the rack.
 *   ticker             Ticker text, items separated by |
 *   source             auto|static. "static" uses the bundled catalog instead of WooCommerce.
 *   refund_url         Link to the refund policy shown at checkout.
 *   delete_url         Link to the data deletion request page shown at checkout.
 */
function mkr_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'category'          => '',
			'limit'             => 60,
			'hide_out_of_stock' => 'no',
			'title'             => 'The Rack',
			'ticker'            => 'More than just a brand|Wakurugenzi|Tap a piece to see it up close|New pieces land on the rack',
			'source'            => 'auto',
			'refund_url'        => '',
			'delete_url'        => '',
		),
		$atts,
		'mkurugenzi'
	);

	wp_enqueue_style( 'mkurugenzi' );
	wp_enqueue_script( 'mkurugenzi' );

	$use_woo  = ( 'static' !== $atts['source'] ) && function_exists( 'wc_get_products' );
	$products = $use_woo ? mkr_products_from_woocommerce( $atts ) : null;

	$config = array(
		'title'      => sanitize_text_field( $atts['title'] ),
		'ticker'     => array_values( array_filter( array_map( 'trim', explode( '|', sanitize_text_field( $atts['ticker'] ) ) ) ) ),
		'products'   => $products,
		'currency'   => $use_woo ? html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES, 'UTF-8' ) : 'KSh',
		'cartUrl'    => $use_woo ? wc_get_cart_url() : '',
		'addToCart'  => $use_woo && class_exists( 'WC_AJAX' ) ? WC_AJAX::get_endpoint( 'add_to_cart' ) : '',
		'fontsUrl'   => MKR_URL . 'assets/fonts/',
		'cart'       => $use_woo ? mkr_cart_config( $atts ) : array(
			'termsUrl'   => '',
			'privacyUrl' => '',
		),
	);

	return sprintf(
		'<div class="mkr" data-mkr-config="%s"><noscript>%s</noscript></div>',
		esc_attr( wp_json_encode( $config ) ),
		esc_html__( 'Turn on JavaScript to browse the rack, or use the shop page.', 'mkurugenzi' )
	);
}
add_shortcode( 'mkurugenzi', 'mkr_shortcode' );
add_shortcode( 'mkurugenzi_rack', 'mkr_shortcode' );
