function validateProduct(product, existingSkus = new Set()) {
  const errors = [];

  // SKU Validation
  if (!product.sku_id || typeof product.sku_id !== "string") {
    errors.push("Missing SKU ID");
  }

  // Product Name Validation
  if (
    !product.product_name ||
    typeof product.product_name !== "string"
  ) {
    errors.push("Missing product name");
  }

  // Selling Price Validation
  if (
    !product.selling_price ||
    isNaN(product.selling_price) ||
    product.selling_price <= 0
  ) {
    errors.push("Invalid selling price");
  }

  // Duplicate SKU Validation
  if (existingSkus.has(product.sku_id)) {
    errors.push("Duplicate SKU");
  }

  // Image Validation
  if (
    !product.images ||
    !Array.isArray(product.images) ||
    product.images.length === 0
  ) {
    errors.push("Missing product images");
  } else {
    product.images.forEach((img) => {
      try {
        new URL(img);
      } catch {
        errors.push(`Invalid image URL: ${img}`);
      }
    });
  }

  // Size Validation
  if (
    !product.available_sizes ||
    !Array.isArray(product.available_sizes) ||
    product.available_sizes.length === 0
  ) {
    errors.push("Missing product sizes");
  }

  // Currency Validation
  if (!product.currency) {
    errors.push("Missing currency");
  }

  // Inventory Validation
  if (!product.inventory) {
    errors.push("Missing inventory data");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = validateProduct;