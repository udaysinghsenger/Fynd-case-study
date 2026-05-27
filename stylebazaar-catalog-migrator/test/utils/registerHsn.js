const axios = require("axios");

async function registerHsnCodes(platformClient, products) {

  const uniqueHsnCodes = [
    ...new Set(products.map((p) => p.hsn_code))
  ];

  console.log("\nRegistering HSN Codes...\n");

  for (const hsn of uniqueHsnCodes) {

    try {

      const response = await axios.post(
        "https://api.fynd.com/service/platform/catalog/v1.0/company/15445/taxes/hscodes",

        {
          hs_code: hsn,
          description: `HSN Code ${hsn}`,
          type: "HS"
        },

        {
          headers: {
            Authorization:
              "Bearer oa-71732a4e6fa34980bbf6331987d2d621e3657894",
            "Content-Type":
              "application/json"
          }
        }
      );

      console.log(
        `HSN Registered Successfully: ${hsn}`
      );

    } catch (error) {

      console.log(
        `HSN Registration Failed for ${hsn}:`,
        error?.response?.data || error.message
      );
    }
  }
}

module.exports = registerHsnCodes;