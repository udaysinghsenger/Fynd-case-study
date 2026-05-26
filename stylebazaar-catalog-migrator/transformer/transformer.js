const CATEGORY_MAPPING = require("./categoryMapping");
const validateProduct = require("./validators");
const fs = require("fs");
const path = require("path");

function transformProducts(data) {
  const transformedProducts = [];
  const existingSkus = new Set();

  const logFilePath = path.join(__dirname, "../logs/migration.log");

  fs.writeFileSync(logFilePath, "");

  data.products.forEach((product) => {
    const validation = validateProduct(product, existingSkus);

    if (!validation.valid) {
      const errorMessage = `[ERROR] SKU: ${
        product.sku_id || "UNKNOWN"
      } => ${validation.errors.join(", ")}\n`;

      fs.appendFileSync(logFilePath, errorMessage);

      console.log(errorMessage);

      return;
    }

    existingSkus.add(product.sku_id);

    let taxRule = "Standard Tax Rule – 18% (Eff. 22 Sep 2025)";

    if (product.gst_percentage === 5) {
      taxRule = "Merit Tax Rule – 5% (Eff. 22 Sep 2025)";
    } else if (product.gst_percentage === 12) {
      taxRule = "Tiered Tax Rule 6 – 12% and 18%";
    }

    const transformedProduct = {
      name: product.product_name,

      // Product description preserved from legacy system.
      // Platform-side Supplementary template validation
      // currently rejects description formatting despite
      // schema reporting string compatibility.

      description: product.description || "",

      item_code: product.sku_id,

      slug: product.sku_id.toLowerCase(),

      brand_uid: 5989,

      company_id: 15445,

      departments: [1],

      item_type: "standard",

      template_tag: "supplementary",

      country_of_origin: "India",

      currency: product.currency || "INR",

      tags: product.tags || [],

      trader: [
        {
          name: "StyleBazaar Trader",

          type: "Manufacturer",

          address: [
            "Mumbai, Maharashtra, India - 400001"
          ]
        }
      ],

      tax_identifier: {
        reporting_hsn: product.hsn_code || "6109"
      },

      return_config: {
        returnable: true,

        time: 10,

        unit: "days"
      },

      category_slug:
        CATEGORY_MAPPING[product.dept] || "others",

      media: product.images.map((img) => ({
        type: "image",

        url: img
      })),

      sizes: product.available_sizes.map((size) => ({
        size: size,

        price: product.mrp,

        price_effective: product.selling_price,

        identifiers: [
          {
            gtin_type: "SKU",

            gtin_value: `${product.sku_id}-${size}`,

            primary: true
          }
        ],

        item_height: 10,

        item_width: 10,

        item_length: 10,

        item_weight: product.weight_grams || 200,

        track_inventory: true
      })),

      attributes: {
        color: product.color,

        material: product.material,

        legacy_hsn_code: product.hsn_code,

        gst_percentage: product.gst_percentage
      },

      is_active: true
    };

    transformedProducts.push(transformedProduct);

    const successMessage = `[SUCCESS] Product transformed: ${product.sku_id}\n`;

    fs.appendFileSync(logFilePath, successMessage);
  });

  return transformedProducts;
}

module.exports = transformProducts;