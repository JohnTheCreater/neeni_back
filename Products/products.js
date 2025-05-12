const db = require("../db");

const insertProduct = async (req, res) => {
  const { type, productName, priceDetails } = req.body;

  if (!(await isProductUnique(productName, type))) {
    res.status(400).send("This product already there! Try new name!");
    return;
  }

  // console.log(priceDetails)
  try {
    let lastId = await new Promise((resolve, reject) => {
      db.query("SELECT MAX(id) as max FROM products", (err, result) => {
        if (err) return reject(err);
        resolve(result[0].max === null ? 0 : result[0].max);
      });
    });

    await console.log("Last Id:", lastId);
    if (type === 1) {
      const volume = await db.query("select * from core_volume");
      const products = await db.query("select * from core_product");

      for (const product of products) {
        for (const vol of volume) {
          if (priceDetails[product.id] && priceDetails[product.id][vol.id]) {
            lastId++;

            const response = await insertProductsIntoTable(
              lastId,
              `${product.name} ${vol.name} ${productName}`,
              priceDetails[product.id][vol.id],
              type
            );
            console.log(response,"  L ",lastId)

            if (response?.err === "ER_DUP_ENTRY")
              res.status(400).send("Duplicate entry!");
            if (response?.code == 500)
              res.status(500).send("An error occurred while inserting data");

            if (response === 200) {
              db.query(
                "INSERT INTO type1info (pid, cpid, cvid) VALUES (?, ?, ?)",
                [lastId, product.id, vol.id],
                (err, result) => {
                  if (err) res.status(500).send("Not fully inserted!");
                  console.log("type 1 inserted");
                }
              );
            }
          }
        }
      }
    } else {
      const response = insertProductsIntoTable(
        lastId + 1,
        productName,
        priceDetails.price,
        type
      );
      if (response?.err === "ER_DUP_ENTRY")
        return res.status(400).send("Duplicate entry!");
      if (response?.code == 500)
        return res.status(500).send("An error occurred while inserting data");
    }
    res.status(200).send();
  } catch (e) {
    console.log(e);
  }
};

const isProductUnique = (productName, type) => {
  return new Promise((resolve, reject) => {
    const sql = `select * from products where name LIKE ? AND type=?`;
    db.query(sql, [`%${productName}`, type], (err, result) => {
      if (err) reject(err);
      console.log(result.length);
      if (result.length == 0) resolve(true);
      resolve(false);
    });
  });
};

const insertProductsIntoTable = (id, name, price, type) => {
 
  return new Promise((resolve,reject)=>{
    let sql_query =
      "INSERT INTO products (id, name, price, type) VALUES (?, ?, ?, ?)";
    db.query(sql_query, [id, name, price, type], (err, result) => {
      if (err) {
        reject({err}) // Send full error object
      }
      console.log("Inserted successfully");
      resolve(200);
    });
  }
)
};

const removeProduct = async (req, res) => {
  const { productId } = req.body;

  const sqlQuery = "delete from products where id=?";
  db.query(sqlQuery, [productId], (err, result) => {
    if (err) res.status(500).send("Error on Back end!");

    if (result.affectedRows === 0)
      return res.status(404).send("No product found with the given ID.");

    res.status(200).send("Product Successfully Removed!");
  });
};

const changePrice = async (req, res) => {
  const { product } = req.body;
  console.log(product);
  let sqlQuery = `update products set price=? where id=? AND name=?`;

  await db.query(
    sqlQuery,
    [product.price, product.id, product.name],
    (err, result) => {
      if (err) throw err;
      res.status(200).send();
    }
  );
};

exports.changePrice = changePrice;
exports.insertProduct = insertProduct;
exports.removeProduct = removeProduct;
