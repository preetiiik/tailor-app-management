const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  res.send("Malani Backend is working");
});


// =====================================================
// HELPERS
// =====================================================

function emptyToNull(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return value;
}


async function getSettings(client = pool) {
  let result = await client.query(
    "SELECT * FROM settings ORDER BY id LIMIT 1"
  );

  if (result.rows.length === 0) {
    result = await client.query(
      `INSERT INTO settings
      (
        store_name,
        phone,
        order_prefix,
        default_delivery_days,
        address
      )
      VALUES
      ('Malani Tailor', '', 'T', 5, '')
      RETURNING *`
    );
  }

  return result.rows[0];
}


// =====================================================
// CUSTOMERS
// =====================================================


// Get all customers
app.get("/api/customers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM customers ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching customers"
    });
  }
});


// Add customer
app.post("/api/customers", async (req, res) => {
  try {
    const {
      name,
      mobile,
      alternate_mobile,
      address,
      city
    } = req.body;


    if (!name || !mobile) {
      return res.status(400).json({
        message: "Name and mobile number are required"
      });
    }


    const result = await pool.query(
      `INSERT INTO customers
      (
        name,
        mobile,
        alternate_mobile,
        address,
        city
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        name.trim(),
        mobile.trim(),
        alternate_mobile || "",
        address || "",
        city || ""
      ]
    );


    res.status(201).json({
      message: "Customer added successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error(error);


    if (error.code === "23505") {
      return res.status(409).json({
        message: "This mobile number already belongs to a customer"
      });
    }


    res.status(500).json({
      message: "Error adding customer",
      error: error.message
    });
  }
});


// Edit customer
app.put("/api/customers/:id", async (req, res) => {
  try {
    const {
      name,
      mobile,
      alternate_mobile,
      address,
      city
    } = req.body;


    const result = await pool.query(
      `UPDATE customers
      SET
        name = $1,
        mobile = $2,
        alternate_mobile = $3,
        address = $4,
        city = $5
      WHERE id = $6
      RETURNING *`,
      [
        name,
        mobile,
        alternate_mobile || "",
        address || "",
        city || "",
        req.params.id
      ]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }


    res.json({
      message: "Customer updated successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error(error);


    if (error.code === "23505") {
      return res.status(409).json({
        message: "This mobile number already belongs to another customer"
      });
    }


    res.status(500).json({
      message: "Error updating customer",
      error: error.message
    });
  }
});


// =====================================================
// PRODUCTS
// =====================================================


// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching products"
    });
  }
});


// Add product
app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      type,
      price,
      styles
    } = req.body;


    if (!name) {
      return res.status(400).json({
        message: "Product name is required"
      });
    }


    const result = await pool.query(
      `INSERT INTO products
      (
        name,
        type,
        price,
        styles
      )
      VALUES ($1,$2,$3,$4)
      RETURNING *`,
      [
        name,
        type || "",
        Number(price || 0),
        styles || ""
      ]
    );


    res.status(201).json({
      message: "Product added successfully",
      product: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error adding product",
      error: error.message
    });
  }
});


// Edit product
app.put("/api/products/:id", async (req, res) => {
  try {
    const {
      name,
      type,
      price,
      styles
    } = req.body;


    const result = await pool.query(
      `UPDATE products
      SET
        name = $1,
        type = $2,
        price = $3,
        styles = $4
      WHERE id = $5
      RETURNING *`,
      [
        name,
        type || "",
        Number(price || 0),
        styles || "",
        req.params.id
      ]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }


    res.json({
      message: "Product updated successfully",
      product: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error updating product",
      error: error.message
    });
  }
});


// =====================================================
// PATTERNS / STYLES
// =====================================================


// Get all patterns
app.get("/api/patterns", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM patterns ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching patterns"
    });
  }
});


// Add pattern
app.post("/api/patterns", async (req, res) => {
  try {
    const {
      name,
      category
    } = req.body;


    const result = await pool.query(
      `INSERT INTO patterns
      (
        name,
        category
      )
      VALUES ($1,$2)
      RETURNING *`,
      [
        name,
        category || ""
      ]
    );


    res.status(201).json({
      message: "Pattern added successfully",
      pattern: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error adding pattern",
      error: error.message
    });
  }
});


// Edit pattern
app.put("/api/patterns/:id", async (req, res) => {
  try {
    const {
      name,
      category
    } = req.body;


    const result = await pool.query(
      `UPDATE patterns
      SET
        name = $1,
        category = $2
      WHERE id = $3
      RETURNING *`,
      [
        name,
        category || "",
        req.params.id
      ]
    );


    if (!result.rows.length) {
      return res.status(404).json({
        message: "Pattern not found"
      });
    }


    res.json({
      message: "Pattern updated successfully",
      pattern: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error updating pattern",
      error: error.message
    });
  }
});


// =====================================================
// PRODUCT PATTERN LINKING
// =====================================================


// Get linked patterns for one product
app.get(
  "/api/products/:productId/patterns",
  async (req, res) => {

    try {
      const result = await pool.query(
        `SELECT
          pp.id AS link_id,
          p.id,
          p.id AS pattern_id,
          p.name,
          p.category,
          p.active

        FROM product_patterns pp

        JOIN patterns p
          ON pp.pattern_id = p.id

        WHERE pp.product_id = $1

        ORDER BY
          p.category,
          p.name`,
        [
          req.params.productId
        ]
      );


      res.json(result.rows);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error fetching linked patterns"
      });
    }
  }
);


// Link pattern
app.post("/api/product-patterns", async (req, res) => {
  try {
    const {
      product_id,
      pattern_id
    } = req.body;


    const result = await pool.query(
      `INSERT INTO product_patterns
      (
        product_id,
        pattern_id
      )
      VALUES ($1,$2)
      RETURNING *`,
      [
        product_id,
        pattern_id
      ]
    );


    res.status(201).json({
      message: "Pattern linked successfully",
      link: result.rows[0]
    });

  } catch (error) {
    console.error(error);


    if (error.code === "23505") {
      return res.status(400).json({
        message: "This pattern is already linked to this product"
      });
    }


    res.status(500).json({
      message: "Error linking pattern",
      error: error.message
    });
  }
});


// Remove pattern link
app.delete(
  "/api/products/:productId/patterns/:patternId",
  async (req, res) => {

    try {
      await pool.query(
        `DELETE FROM product_patterns
        WHERE
          product_id = $1
          AND pattern_id = $2`,
        [
          req.params.productId,
          req.params.patternId
        ]
      );


      res.json({
        message: "Pattern unlinked successfully"
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error unlinking pattern",
        error: error.message
      });
    }
  }
);


// =====================================================
// STAFF
// =====================================================


// Get all staff
app.get("/api/staff", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM staff ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching staff"
    });
  }
});


// Add staff
app.post("/api/staff", async (req, res) => {
  try {
    const {
      name,
      mobile,
      role
    } = req.body;


    const result = await pool.query(
      `INSERT INTO staff
      (
        name,
        mobile,
        role
      )
      VALUES ($1,$2,$3)
      RETURNING *`,
      [
        name,
        mobile || "",
        role || ""
      ]
    );


    res.status(201).json({
      message: "Staff added successfully",
      staff: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error adding staff",
      error: error.message
    });
  }
});


// Edit staff
app.put("/api/staff/:id", async (req, res) => {
  try {
    const {
      name,
      mobile,
      role
    } = req.body;


    const result = await pool.query(
      `UPDATE staff
      SET
        name = $1,
        mobile = $2,
        role = $3
      WHERE id = $4
      RETURNING *`,
      [
        name,
        mobile || "",
        role || "",
        req.params.id
      ]
    );


    if (!result.rows.length) {
      return res.status(404).json({
        message: "Staff member not found"
      });
    }


    res.json({
      message: "Staff updated successfully",
      staff: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error updating staff",
      error: error.message
    });
  }
});


// =====================================================
// MEASUREMENTS
// =====================================================


// Get all measurements
app.get("/api/measurements", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        m.*,
        c.name AS customer_name,
        p.name AS product_name

      FROM measurements m

      JOIN customers c
        ON m.customer_id = c.id

      JOIN products p
        ON m.product_id = p.id

      ORDER BY m.id DESC`
    );


    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching measurements"
    });
  }
});


// Get measurements for one customer
app.get(
  "/api/customers/:customerId/measurements",
  async (req, res) => {

    try {
      const result = await pool.query(
        `SELECT
          m.*,
          p.name AS product_name

        FROM measurements m

        JOIN products p
          ON m.product_id = p.id

        WHERE m.customer_id = $1

        ORDER BY m.id DESC`,
        [
          req.params.customerId
        ]
      );


      res.json(result.rows);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error fetching measurements"
      });
    }
  }
);


// Previous profiles for this exact customer and product, newest first.
app.get("/api/customers/:customerId/products/:productId/measurements", async (req, res) => {
  const { customerId, productId } = req.params;
  if (!/^\d+$/.test(customerId) || !/^\d+$/.test(productId)) {
    return res.status(400).json({ message: "Invalid customer or product ID" });
  }
  try {
    const result = await pool.query(
      `SELECT m.*, p.name AS product_name
       FROM measurements m
       JOIN products p ON p.id = m.product_id
       WHERE m.customer_id = $1 AND m.product_id = $2
       ORDER BY m.created_at DESC NULLS LAST, m.id DESC`,
      [customerId, productId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching measurements" });
  }
});

// Add measurement
app.post("/api/measurements", async (req, res) => {
  try {
    const {
      customer_id,
      product_id,
      profile,
      chest,
      waist,
      shoulder,
      sleeve,
      length,
      neck,
      arm_hole,
      seat,
      thigh,
      knee,
      bottom,
      outseam,
      inseam,
      notes
    } = req.body;


    const result = await pool.query(
      `INSERT INTO measurements
      (
        customer_id,
        product_id,
        profile,
        chest,
        waist,
        shoulder,
        sleeve,
        length,
        neck,
        arm_hole,
        seat,
        thigh,
        knee,
        bottom,
        outseam,
        inseam,
        notes
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17
      )
      RETURNING *`,
      [
        customer_id,
        product_id,
        profile || "Regular Fit",
        emptyToNull(chest),
        emptyToNull(waist),
        emptyToNull(shoulder),
        emptyToNull(sleeve),
        emptyToNull(length),
        emptyToNull(neck),
        emptyToNull(arm_hole),
        emptyToNull(seat),
        emptyToNull(thigh),
        emptyToNull(knee),
        emptyToNull(bottom),
        emptyToNull(outseam),
        emptyToNull(inseam),
        notes || ""
      ]
    );


    res.status(201).json({
      message: "Measurement added successfully",
      measurement: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error adding measurement",
      error: error.message
    });
  }
});


// Edit measurement
app.put("/api/measurements/:id", async (req, res) => {
  try {
    const {
      customer_id,
      product_id,
      profile,
      chest,
      waist,
      shoulder,
      sleeve,
      length,
      neck,
      arm_hole,
      seat,
      thigh,
      knee,
      bottom,
      outseam,
      inseam,
      notes
    } = req.body;


    const result = await pool.query(
      `UPDATE measurements
      SET
        customer_id = $1,
        product_id = $2,
        profile = $3,
        chest = $4,
        waist = $5,
        shoulder = $6,
        sleeve = $7,
        length = $8,
        neck = $9,
        arm_hole = $10,
        seat = $11,
        thigh = $12,
        knee = $13,
        bottom = $14,
        outseam = $15,
        inseam = $16,
        notes = $17
      WHERE id = $18
      RETURNING *`,
      [
        customer_id,
        product_id,
        profile || "Regular Fit",
        emptyToNull(chest),
        emptyToNull(waist),
        emptyToNull(shoulder),
        emptyToNull(sleeve),
        emptyToNull(length),
        emptyToNull(neck),
        emptyToNull(arm_hole),
        emptyToNull(seat),
        emptyToNull(thigh),
        emptyToNull(knee),
        emptyToNull(bottom),
        emptyToNull(outseam),
        emptyToNull(inseam),
        notes || "",
        req.params.id
      ]
    );


    if (!result.rows.length) {
      return res.status(404).json({
        message: "Measurement not found"
      });
    }


    res.json({
      message: "Measurement updated successfully",
      measurement: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error updating measurement",
      error: error.message
    });
  }
});


// =====================================================
// SETTINGS
// =====================================================


// Get settings
app.get("/api/settings", async (req, res) => {
  try {
    const settings =
      await getSettings();

    res.json(settings);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching settings"
    });
  }
});


// Update settings
app.put("/api/settings", async (req, res) => {
  try {
    const {
      store_name,
      phone,
      order_prefix,
      default_delivery_days,
      address
    } = req.body;


    const current =
      await getSettings();


    const result = await pool.query(
      `UPDATE settings
      SET
        store_name = $1,
        phone = $2,
        order_prefix = $3,
        default_delivery_days = $4,
        address = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *`,
      [
        store_name || "Malani Tailor",
        phone || "",
        (order_prefix || "T").toUpperCase(),
        Number(default_delivery_days || 5),
        address || "",
        current.id
      ]
    );


    res.json({
      message: "Settings updated successfully",
      settings: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error updating settings",
      error: error.message
    });
  }
});



// =====================================================
// MASTER CONFIG
// =====================================================


// Get all master config values
app.get("/api/master-config", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM master_config
       ORDER BY config_type, display_order, id`
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching master config",
      error: error.message
    });
  }
});


// Get master config by type
app.get("/api/master-config/:type", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM master_config
       WHERE config_type = $1
       AND active = TRUE
       ORDER BY display_order, id`,
      [req.params.type]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching master config",
      error: error.message
    });
  }
});


// Add master config value
app.post("/api/master-config", async (req, res) => {
  try {
    const {
      config_type,
      config_key,
      config_value,
      display_order,
      active
    } = req.body;

    if (!config_type || !config_key || !config_value) {
      return res.status(400).json({
        message:
          "Config type, key and value are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO master_config
      (
        config_type,
        config_key,
        config_value,
        display_order,
        active
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        config_type.trim(),
        config_key.trim().toLowerCase(),
        config_value.trim(),
        Number(display_order || 0),
        active !== false
      ]
    );

    res.status(201).json({
      message: "Master config added successfully",
      config: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "This master config already exists"
      });
    }

    res.status(500).json({
      message: "Error adding master config",
      error: error.message
    });
  }
});


// Edit master config value
app.put("/api/master-config/:id", async (req, res) => {
  try {
    const {
      config_type,
      config_key,
      config_value,
      display_order,
      active
    } = req.body;

    const result = await pool.query(
      `UPDATE master_config
       SET
         config_type = $1,
         config_key = $2,
         config_value = $3,
         display_order = $4,
         active = $5,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        config_type,
        config_key,
        config_value,
        Number(display_order || 0),
        active !== false,
        req.params.id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: "Master config not found"
      });
    }

    res.json({
      message: "Master config updated successfully",
      config: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "This master config already exists"
      });
    }

    res.status(500).json({
      message: "Error updating master config",
      error: error.message
    });
  }
});


// Enable / disable master config value
app.patch(
  "/api/master-config/:id/status",
  async (req, res) => {
    try {
      const { active } = req.body;

      const result = await pool.query(
        `UPDATE master_config
         SET
           active = $1,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [
          Boolean(active),
          req.params.id
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          message: "Master config not found"
        });
      }

      res.json({
        message:
          "Master config status updated successfully",
        config: result.rows[0]
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Error updating master config status",
        error: error.message
      });
    }
  }
);



// =====================================================
// CREATE ORDER
// =====================================================

app.post("/api/orders", async (req, res) => {

  const client =
    await pool.connect();


  try {
    await client.query("BEGIN");


    const {
      customer_id,
      trial_date,
      delivery_date,
      total_amount,
      advance_amount,
      priority,
      payment_method,
      notes,
      items
    } = req.body;


    if (!customer_id) {
      throw new Error(
        "Customer is required"
      );
    }


    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new Error(
        "At least one garment is required"
      );
    }


    const settings =
      await getSettings(client);


    const prefix =
      settings.order_prefix ||
      "T";


    const orderNumber =
      prefix +
      Date.now()
        .toString()
        .slice(-8);


    const total =
      Number(
        total_amount || 0
      );


    const advance =
      Number(
        advance_amount || 0
      );


    const balance =
      total -
      advance;


    const orderResult =
      await client.query(
        `INSERT INTO orders
        (
          order_number,
          customer_id,
          trial_date,
          delivery_date,
          total_amount,
          advance_amount,
          balance_amount,
          status,
          priority,
          payment_method,
          notes
        )
        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7,
          $8,$9,$10,$11
        )
        RETURNING *`,
        [
          orderNumber,
          customer_id,
          trial_date || null,
          delivery_date || null,
          total,
          advance,
          balance,
          "Cutting",
          priority || "Normal",
          payment_method || "Cash",
          notes || ""
        ]
      );


    const order =
      orderResult.rows[0];


    for (
      const item of items
    ) {

      const itemResult =
        await client.query(
          `INSERT INTO order_items
          (
            order_id,
            product_id,
            quantity,
            price,
            staff_id,
            measurement_id,
            notes
          )
          VALUES
          (
            $1,$2,$3,$4,$5,$6,$7
          )
          RETURNING *`,
          [
            order.id,
            item.product_id,
            Number(
              item.quantity || 1
            ),
            Number(
              item.price || 0
            ),
            item.staff_id || null,
            item.measurement_id || null,
            item.notes || ""
          ]
        );


      const orderItem =
        itemResult.rows[0];


      if (
        Array.isArray(
          item.pattern_ids
        )
      ) {

        for (
          const patternId of
          item.pattern_ids
        ) {

          await client.query(
            `INSERT INTO order_item_patterns
            (
              order_item_id,
              pattern_id
            )
            VALUES ($1,$2)
            ON CONFLICT DO NOTHING`,
            [
              orderItem.id,
              patternId
            ]
          );
        }
      }


      await client.query(
        `INSERT INTO production_history
        (
          order_item_id,
          status,
          staff_id,
          notes
        )
        VALUES ($1,$2,$3,$4)`,
        [
          orderItem.id,
          "Cutting",
          item.staff_id || null,
          "Order entered into cutting queue"
        ]
      );
    }


    if (advance > 0) {

      await client.query(
        `INSERT INTO payments
        (
          order_id,
          amount,
          payment_method,
          note
        )
        VALUES ($1,$2,$3,$4)`,
        [
          order.id,
          advance,
          payment_method || "Cash",
          "Advance payment"
        ]
      );
    }


    await client.query(
      "COMMIT"
    );


    res.status(201).json({
      message:
        "Order created successfully",

      order
    });

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );


    console.error(error);


    res.status(500).json({
      message:
        "Error creating order",

      error:
        error.message
    });

  } finally {

    client.release();
  }
});


// =====================================================
// GET ALL ORDERS
// =====================================================

app.get("/api/orders", async (req, res) => {
  try {
    const result =
      await pool.query(
        `SELECT
          o.*,

          c.name AS customer_name,
          c.mobile AS customer_mobile,

          (
            SELECT string_agg(
              p.name ||
              ' ×' ||
              oi.quantity::text,
              ', '
              ORDER BY oi.id
            )

            FROM order_items oi

            JOIN products p
              ON oi.product_id = p.id

            WHERE oi.order_id = o.id
          ) AS items,

          (
            SELECT string_agg(
              DISTINCT s.name,
              ', '
            )

            FROM order_items oi

            JOIN staff s
              ON oi.staff_id = s.id

            WHERE oi.order_id = o.id
          ) AS staff_name

        FROM orders o

        JOIN customers c
          ON o.customer_id = c.id

        ORDER BY o.id DESC`
      );


    res.json(
      result.rows
    );

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error fetching orders"
    });
  }
});


// =====================================================
// GET ONE COMPLETE ORDER
// =====================================================

app.get("/api/orders/:id", async (req, res) => {
  try {
    const {
      id
    } = req.params;


    const orderResult =
      await pool.query(
        `SELECT
          o.*,

          c.name AS customer_name,
          c.mobile AS customer_mobile,
          c.alternate_mobile,
          c.address,
          c.city

        FROM orders o

        JOIN customers c
          ON o.customer_id = c.id

        WHERE
          o.id::text = $1
          OR o.order_number = $1`,
        [
          id
        ]
      );


    if (
      orderResult.rows.length ===
      0
    ) {
      return res.status(404).json({
        message:
          "Order not found"
      });
    }


    const order =
      orderResult.rows[0];


    const itemsResult =
      await pool.query(
        `SELECT

          oi.id,
          oi.order_id,
          oi.product_id,
          oi.quantity,
          oi.price,
          oi.staff_id,
          oi.measurement_id,
          oi.notes,
          oi.created_at,

          p.name AS product_name,
          p.type AS product_type,

          s.name AS staff_name,
          s.role AS staff_role,

          m.profile,
          m.chest,
          m.waist,
          m.shoulder,
          m.sleeve,
          m.length,
          m.neck,
          m.arm_hole,
          m.seat,
          m.thigh,
          m.knee,
          m.bottom,
          m.outseam,
          m.inseam,
          m.notes AS measurement_notes,

          (
            SELECT ph.status

            FROM production_history ph

            WHERE
              ph.order_item_id =
              oi.id

            ORDER BY
              ph.updated_at DESC,
              ph.id DESC

            LIMIT 1
          )
          AS current_production_status

        FROM order_items oi

        JOIN products p
          ON oi.product_id = p.id

        LEFT JOIN staff s
          ON oi.staff_id = s.id

        LEFT JOIN measurements m
          ON oi.measurement_id = m.id

        WHERE oi.order_id = $1

        ORDER BY oi.id ASC`,
        [
          order.id
        ]
      );


    for (
      const item of
      itemsResult.rows
    ) {

      const patternsResult =
        await pool.query(
          `SELECT
            p.id,
            p.name,
            p.category

          FROM order_item_patterns oip

          JOIN patterns p
            ON oip.pattern_id = p.id

          WHERE
            oip.order_item_id = $1

          ORDER BY
            p.category,
            p.name`,
          [
            item.id
          ]
        );


      item.patterns =
        patternsResult.rows;


      const productionResult =
        await pool.query(
          `SELECT
            ph.id,
            ph.status,
            ph.notes,
            ph.updated_at,

            s.id AS staff_id,
            s.name AS staff_name

          FROM production_history ph

          LEFT JOIN staff s
            ON ph.staff_id = s.id

          WHERE
            ph.order_item_id = $1

          ORDER BY
            ph.updated_at ASC,
            ph.id ASC`,
          [
            item.id
          ]
        );


      item.production_history =
        productionResult.rows;
    }


    const paymentsResult =
      await pool.query(
        `SELECT *

        FROM payments

        WHERE order_id = $1

        ORDER BY
          payment_date ASC,
          id ASC`,
        [
          order.id
        ]
      );


    res.json({
      order,
      items:
        itemsResult.rows,
      payments:
        paymentsResult.rows
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error fetching complete order",

      error:
        error.message
    });
  }
});


// =====================================================
// EDIT ORDER
// =====================================================

app.put("/api/orders/:id", async (req, res) => {

  const client =
    await pool.connect();


  try {

    await client.query(
      "BEGIN"
    );


    const {
      trial_date,
      delivery_date,
      total_amount,
      advance_amount,
      status,
      staff,
      staff_id,
      priority,
      payment_method,
      notes
    } = req.body;


    const existingResult =
      await client.query(
        `SELECT *

        FROM orders

        WHERE
          id::text = $1
          OR order_number = $1`,
        [
          req.params.id
        ]
      );


    if (
      !existingResult.rows.length
    ) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(404).json({
        message:
          "Order not found"
      });
    }


    const existing =
      existingResult.rows[0];


    const total =
      Number(
        total_amount ??
        existing.total_amount
      );


    const advance =
      Number(
        advance_amount ??
        existing.advance_amount
      );


    const balance =
      total -
      advance;


    const orderResult =
      await client.query(
        `UPDATE orders

        SET
          trial_date = $1,
          delivery_date = $2,
          total_amount = $3,
          advance_amount = $4,
          balance_amount = $5,
          status = $6,
          priority = $7,
          payment_method = $8,
          notes = $9

        WHERE id = $10

        RETURNING *`,
        [
          trial_date ??
            existing.trial_date,

          delivery_date ??
            existing.delivery_date,

          total,

          advance,

          balance,

          status ||
            existing.status,

          priority ||
            existing.priority,

          payment_method ||
            existing.payment_method,

          notes ??
            existing.notes,

          existing.id
        ]
      );


    let resolvedStaffId =
      staff_id || null;


    if (
      !resolvedStaffId &&
      staff
    ) {

      const staffResult =
        await client.query(
          `SELECT id

          FROM staff

          WHERE name = $1

          LIMIT 1`,
          [
            staff
          ]
        );


      resolvedStaffId =
        staffResult.rows[0]?.id ||
        null;
    }


    if (
      resolvedStaffId
    ) {

      await client.query(
        `UPDATE order_items

        SET staff_id = $1

        WHERE order_id = $2`,
        [
          resolvedStaffId,
          existing.id
        ]
      );
    }


    if (
      advance_amount !==
      undefined
    ) {

      await client.query(
        `DELETE FROM payments

        WHERE
          order_id = $1
          AND note = 'Advance payment'`,
        [
          existing.id
        ]
      );


      if (
        advance > 0
      ) {

        await client.query(
          `INSERT INTO payments
          (
            order_id,
            amount,
            payment_method,
            note
          )
          VALUES ($1,$2,$3,$4)`,
          [
            existing.id,
            advance,
            payment_method ||
              existing.payment_method ||
              "Cash",
            "Advance payment"
          ]
        );
      }
    }


    await client.query(
      "COMMIT"
    );


    res.json({
      message:
        "Order updated successfully",

      order:
        orderResult.rows[0]
    });

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );


    console.error(error);


    res.status(500).json({
      message:
        "Error updating order",

      error:
        error.message
    });

  } finally {

    client.release();
  }
});


// =====================================================
// PAYMENTS
// =====================================================


// Add another payment
app.post(
  "/api/orders/:id/payments",
  async (req, res) => {

    const client =
      await pool.connect();


    try {

      await client.query(
        "BEGIN"
      );


      const {
        amount,
        payment_method,
        note
      } = req.body;


      const orderResult =
        await client.query(
          `SELECT *

          FROM orders

          WHERE
            id::text = $1
            OR order_number = $1`,
          [
            req.params.id
          ]
        );


      if (
        !orderResult.rows.length
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          message:
            "Order not found"
        });
      }


      const order =
        orderResult.rows[0];


      const paymentResult =
        await client.query(
          `INSERT INTO payments
          (
            order_id,
            amount,
            payment_method,
            note
          )
          VALUES ($1,$2,$3,$4)
          RETURNING *`,
          [
            order.id,
            Number(amount),
            payment_method ||
              "Cash",
            note || ""
          ]
        );


      const totalPaidResult =
        await client.query(
          `SELECT
            COALESCE(
              SUM(amount),
              0
            ) AS total_paid

          FROM payments

          WHERE order_id = $1`,
          [
            order.id
          ]
        );


      const totalPaid =
        Number(
          totalPaidResult
            .rows[0]
            .total_paid
        );


      await client.query(
        `UPDATE orders

        SET
          advance_amount = $1,
          balance_amount =
            GREATEST(
              total_amount - $1,
              0
            )

        WHERE id = $2`,
        [
          totalPaid,
          order.id
        ]
      );


      await client.query(
        "COMMIT"
      );


      res.status(201).json({
        message:
          "Payment added successfully",

        payment:
          paymentResult.rows[0]
      });

    } catch (error) {

      await client.query(
        "ROLLBACK"
      );


      console.error(error);


      res.status(500).json({
        message:
          "Error adding payment",

        error:
          error.message
      });

    } finally {

      client.release();
    }
  }
);


// =====================================================
// PRODUCTION
// =====================================================


// Get production history
app.get(
  "/api/order-items/:orderItemId/production",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `SELECT
            ph.*,
            s.name AS staff_name

          FROM production_history ph

          LEFT JOIN staff s
            ON ph.staff_id = s.id

          WHERE
            ph.order_item_id = $1

          ORDER BY
            ph.updated_at ASC,
            ph.id ASC`,
          [
            req.params.orderItemId
          ]
        );


      res.json(
        result.rows
      );

    } catch (error) {

      console.error(error);


      res.status(500).json({
        message:
          "Error fetching production history"
      });
    }
  }
);


// Add production status
app.post("/api/production", async (req, res) => {

  const client =
    await pool.connect();


  try {

    await client.query(
      "BEGIN"
    );


    const {
      order_item_id,
      status,
      staff_id,
      notes
    } = req.body;


    const result =
      await client.query(
        `INSERT INTO production_history
        (
          order_item_id,
          status,
          staff_id,
          notes
        )
        VALUES ($1,$2,$3,$4)
        RETURNING *`,
        [
          order_item_id,
          status,
          staff_id || null,
          notes || ""
        ]
      );


    const itemResult =
      await client.query(
        `SELECT order_id

        FROM order_items

        WHERE id = $1`,
        [
          order_item_id
        ]
      );


    if (
      itemResult.rows.length
    ) {

      await client.query(
        `UPDATE orders

        SET status = $1

        WHERE id = $2`,
        [
          status,
          itemResult.rows[0].order_id
        ]
      );
    }


    await client.query(
      "COMMIT"
    );


    res.status(201).json({
      message:
        "Production status updated successfully",

      production:
        result.rows[0]
    });

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );


    console.error(error);


    res.status(500).json({
      message:
        "Error updating production status",

      error:
        error.message
    });

  } finally {

    client.release();
  }
});


// =====================================================
// SERVER
// =====================================================

// app.listen(5000, () => {
//   console.log(
//     "Server running on http://localhost:5000"
//   );
// });


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});