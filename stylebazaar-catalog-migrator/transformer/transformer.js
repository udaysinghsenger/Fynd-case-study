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

    let taxRuleId = "";

if (product.gst_percentage === 5) {

  taxRuleId = "6a16107071e16ade1bf962da";

} else if (product.gst_percentage === 12) {

  taxRuleId = "6a1610cd76cace0b92af8786";

}

    const transformedProduct = {
      name: product.product_name,

      description: Buffer.from(
  `<p>${product.description}</p>`
).toString("base64"),

      item_code: product.sku_id,

      slug: product.sku_id.toLowerCase(),

      brand_uid: 5989,

      company_id: 15445,

      departments: [8],

      item_type: "standard",

      template_tag: "supplementary",
      category_slug: "others-level-3",

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
  tax_rule_id: taxRuleId
},

hs_code: product.hsn_code,

      return_config: {
        returnable: true,

        time: 10,

        unit: "days"
      },

    

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
            gtin_type: "sku_code",

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