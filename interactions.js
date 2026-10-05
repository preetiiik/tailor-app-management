// ============================================================
// MALANI TAILOR MANAGEMENT
// SAME ORIGINAL UI + BACKEND / POSTGRESQL
// ============================================================

const API_URL = "https://tailor-app-management.onrender.com";


// ============================================================
// BASIC HELPERS
// ============================================================

const escapeHTML = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c])
  );


const todayISO = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};


let stages = [
  "Cutting",
  "Stitching",
  "Trial",
  "Ready",
  "Delivered"
];


let lastOrder = null;
let returnFocus = null;


// ============================================================
// REMOVE OLD DEMO DATA
// Real data will come from PostgreSQL.
// ============================================================

state.customers = [];
state.products = [];
state.staff = [];
state.measurements = [];
state.orders = [];

state.patterns = [];

state.masterConfig = {};

state.orderDetails = {};


// ============================================================
// DEFAULT SETTINGS UNTIL BACKEND LOADS
// ============================================================

state.settings = {
  name: "Malani Tailor",
  phone: "",
  prefix: "T",
  days: 5,
  address: ""
};


// ============================================================
// API HELPER
// ============================================================

async function apiRequest(
  path,
  options = {}
) {
  const response = await fetch(
    `${API_URL}${path}`,
    options
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
      data?.error ||
      "Backend request failed"
    );
    error.status = response.status;
    throw error;
  }

  return data;
}


// ============================================================
// KEEP OLD persist() CALLS SAFE
// Data is now stored in PostgreSQL.
// ============================================================

function persist() {
  return true;
}


// ============================================================
// CUSTOMER MAPPING
// ============================================================

function mapCustomer(c) {
  return {
    id: Number(c.id),

    name: c.name || "",

    phone: c.mobile || "",

    city: c.city || "",

    alternate:
      c.alternate_mobile || "",

    address:
      c.address || "",

    orders: 0,

    last: "—"
  };
}


// ============================================================
// PRODUCT MAPPING
// ============================================================

function mapProduct(p) {
  return {
    id: Number(p.id),

    name: p.name || "",

    type: p.type || "",

    price:
      Number(p.price || 0),

    styles:
      p.styles ||
      "Fit: Regular, Comfort"
  };
}


// ============================================================
// STAFF MAPPING
// ============================================================

function mapStaff(s) {
  return {
    id: Number(s.id),

    name: s.name || "",

    role: s.role || "",

    phone:
      s.mobile || ""
  };
}


// ============================================================
// MEASUREMENT MAPPING
// ============================================================

function mapMeasurement(m) {
  const garment =
    m.product_name ||
    state.products.find(
      p =>
        Number(p.id) ===
        Number(m.product_id)
    )?.name ||
    "";

  const values = {};

  if (
    m.chest !== null &&
    m.chest !== undefined
  ) {
    values.Chest =
      Number(m.chest);
  }

  if (
    m.waist !== null &&
    m.waist !== undefined
  ) {
    values.Waist =
      Number(m.waist);
  }

  if (
    m.shoulder !== null &&
    m.shoulder !== undefined
  ) {
    values.Shoulder =
      Number(m.shoulder);
  }

  if (
    m.sleeve !== null &&
    m.sleeve !== undefined
  ) {
    values.Sleeve =
      Number(m.sleeve);
  }

  if (
    m.length !== null &&
    m.length !== undefined
  ) {
    values.Length =
      Number(m.length);
  }

  if (
    m.neck !== null &&
    m.neck !== undefined
  ) {
    values.Neck =
      Number(m.neck);
  }

  if (
    m.arm_hole !== null &&
    m.arm_hole !== undefined
  ) {
    values["Arm Hole"] =
      Number(m.arm_hole);
  }

  if (
    m.seat !== null &&
    m.seat !== undefined
  ) {
    values.Seat =
      Number(m.seat);
  }

  if (
    m.thigh !== null &&
    m.thigh !== undefined
  ) {
    values.Thigh =
      Number(m.thigh);
  }

  if (
    m.knee !== null &&
    m.knee !== undefined
  ) {
    values.Knee =
      Number(m.knee);
  }

  if (
    m.bottom !== null &&
    m.bottom !== undefined
  ) {
    values.Bottom =
      Number(m.bottom);
  }

  if (
    m.outseam !== null &&
    m.outseam !== undefined
  ) {
    values.Outseam =
      Number(m.outseam);
  }

  if (
    m.inseam !== null &&
    m.inseam !== undefined
  ) {
    values.Inseam =
      Number(m.inseam);
  }

  return {
    id: Number(m.id),

    customerId:
      Number(m.customer_id),

    productId:
      Number(m.product_id),

    garment,

    profile:
      m.profile ||
      "Regular Fit",

    values,

    updated:
      m.created_at
        ? String(
            m.created_at
          ).slice(0, 10)
        : "",

    notes:
      m.notes || ""
  };
}


// ============================================================
// ORDER MAPPING
// ============================================================

function mapOrder(o) {
  const delivery =
    o.delivery_date
      ? String(
          o.delivery_date
        ).slice(0, 10)
      : "";

  const trial =
    o.trial_date
      ? String(
          o.trial_date
        ).slice(0, 10)
      : "";

  return {
    id: Number(o.id),

    no:
      o.order_number ||
      String(o.id),

    customerId:
      Number(o.customer_id),

    customer:
      o.customer_name ||
      "Unknown",

    customerMobile:
      o.customer_mobile ||
      "",

    items:
      o.items ||
      "View Order",

    status:
      o.status ||
      "Cutting",

    staff:
      o.staff_name ||
      "",

    trial,

    delivery,

    deliveryDate:
      delivery,

    total:
      Number(
        o.total_amount ||
        0
      ),

    advance:
      Number(
        o.advance_amount ||
        0
      ),

    amount:
      money(
        Number(
          o.total_amount ||
          0
        )
      ),

    priority:
      o.priority ||
      "Normal",

    paymentMethod:
      o.payment_method ||
      "Cash",

    notes:
      o.notes || "",

    styles: [],

    measurements: {},

    garment: "",

    qty: 1,

    price: 0
  };
}


// ============================================================
// LOAD CUSTOMERS
// ============================================================

async function loadCustomersFromBackend(
  shouldRender = false
) {
  try {
    const data =
      await apiRequest(
        "/api/customers"
      );

    state.customers =
      (data || []).map(
        mapCustomer
      );

    if (shouldRender) {
      render();
    }

    return state.customers;

  } catch (error) {
    console.error(
      "Customer load error:",
      error
    );

    toast(
      "Could not load customers."
    );

    return [];
  }
}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProductsFromBackend(
  shouldRender = false
) {
  try {
    const data =
      await apiRequest(
        "/api/products"
      );

    state.products =
      (data || []).map(
        mapProduct
      );

    if (shouldRender) {
      render();
    }

    return state.products;

  } catch (error) {
    console.error(
      "Product load error:",
      error
    );

    toast(
      "Could not load products."
    );

    return [];
  }
}


// ============================================================
// LOAD STAFF
// ============================================================

async function loadStaffFromBackend(
  shouldRender = false
) {
  try {
    const data =
      await apiRequest(
        "/api/staff"
      );

    state.staff =
      (data || []).map(
        mapStaff
      );

    if (shouldRender) {
      render();
    }

    return state.staff;

  } catch (error) {
    console.error(
      "Staff load error:",
      error
    );

    toast(
      "Could not load staff."
    );

    return [];
  }
}


// ============================================================
// LOAD MEASUREMENTS
// ============================================================

async function loadMeasurementsFromBackend(
  shouldRender = false
) {
  try {
    const data =
      await apiRequest(
        "/api/measurements"
      );

    state.measurements =
      (data || []).map(
        mapMeasurement
      );

    if (shouldRender) {
      render();
    }

    return state.measurements;

  } catch (error) {
    console.error(
      "Measurement load error:",
      error
    );

    toast(
      "Could not load measurements."
    );

    return [];
  }
}


// ============================================================
// LOAD ORDERS
// ============================================================

async function loadOrdersFromBackend(
  shouldRender = false
) {
  try {
    const data =
      await apiRequest(
        "/api/orders"
      );

    state.orders =
      (data || []).map(
        mapOrder
      );

    const badge =
      $("#ordersBadge");

    if (badge) {
      badge.textContent =
        state.orders.length;
    }

    if (shouldRender) {
      render();
    }

    return state.orders;

  } catch (error) {
    console.error(
      "Order load error:",
      error
    );

    toast(
      "Could not load orders."
    );

    return [];
  }
}


// ============================================================
// LOAD PAYMENTS
// ============================================================

async function loadPaymentsFromBackend(
  shouldRender = false
) {
  try {
    const data =
      await apiRequest(
        "/api/payments"
      );

    state.payments =
      data || [];

    if (shouldRender) {
      render();
    }

    return state.payments;

  } catch (error) {
    console.error(
      "Payment load error:",
      error
    );

    toast(
      "Could not load payments."
    );

    return [];
  }
}

// ============================================================
// LOAD SETTINGS
// ============================================================

async function loadSettingsFromBackend(
  shouldRender = false
) {
  try {
    const data =
      await apiRequest(
        "/api/settings"
      );

    state.settings = {
      name:
        data.store_name ||
        "Malani Tailor",

      phone:
        data.phone || "",

      prefix:
        data.order_prefix ||
        "T",

      days:
        Number(
          data.default_delivery_days ||
          5
        ),

      address:
        data.address || ""
    };

    if (shouldRender) {
      render();
    }

    return state.settings;

  } catch (error) {
    console.error(
      "Settings load error:",
      error
    );

    return state.settings;
  }
}

// ============================================================
// LOAD MASTER CONFIG
// ============================================================

function masterOptions(
  type,
  fallback = []
) {
  const values =
    state.masterConfig?.[type] || [];

  return values.length
    ? values.map(
        item =>
          item.config_value
      )
    : fallback;
}


async function loadMasterConfigFromBackend() {
  try {
    const data =
      await apiRequest(
        "/api/master-config"
      );

    state.masterConfig = {};

    (data || [])
      .filter(
        item =>
          item.active !== false
      )
      .sort(
        (a, b) =>
          Number(
            a.display_order || 0
          ) -
          Number(
            b.display_order || 0
          )
      )
      .forEach(item => {

        if (
          !state.masterConfig[
            item.config_type
          ]
        ) {
          state.masterConfig[
            item.config_type
          ] = [];
        }

        state.masterConfig[
          item.config_type
        ].push(item);
      });


    stages =
      masterOptions(
        "order_status",
        [
          "Cutting",
          "Stitching",
          "Trial",
          "Ready",
          "Delivered"
        ]
      );

    return state.masterConfig;

  } catch (error) {

    console.error(
      "Master config load error:",
      error
    );

    return state.masterConfig;
  }
}

// ============================================================
// LOAD PATTERNS
// ============================================================

async function loadPatternsFromBackend() {
  try {
    const data =
      await apiRequest(
        "/api/patterns"
      );

    state.patterns =
      data || [];

    return state.patterns;

  } catch (error) {
    console.error(
      "Pattern load error:",
      error
    );

    state.patterns = [];

    return [];
  }
}


// ============================================================
// LOAD PRODUCT PATTERNS
// ============================================================

async function loadProductPatterns(
  productId
) {
  try {
    return await apiRequest(
      `/api/products/${productId}/patterns`
    );

  } catch (error) {
    console.error(
      "Product styles error:",
      error
    );

    return [];
  }
}


// ============================================================
// ORIGINAL STYLE GROUP FORMAT
// ============================================================

function styleGroups(text) {
  return String(text || "")
    .split("\n")
    .filter(
      line =>
        line.trim()
    )
    .map(line => {
      const i =
        line.indexOf(":");

      if (i === -1) {
        return [
          line.trim(),
          []
        ];
      }

      return [
        line
          .slice(0, i)
          .trim(),

        line
          .slice(i + 1)
          .split(",")
          .map(
            value =>
              value.trim()
          )
          .filter(Boolean)
      ];
    });
}


// ============================================================
// SYNCHRONISE PRODUCT STYLE TEXT WITH PATTERN TABLES
// UI stays the same.
// ============================================================

async function syncProductStyles(
  productId,
  stylesText
) {
  await loadPatternsFromBackend();

  const desired = [];

  for (
    const [category, options]
    of styleGroups(stylesText)
  ) {
    for (
      const option of options
    ) {
      desired.push({
        category,
        name: option
      });
    }
  }

  let linked =
    await loadProductPatterns(
      productId
    );

  for (
    const style of desired
  ) {
    let pattern =
      state.patterns.find(
        p =>
          String(
            p.name
          ).toLowerCase() ===
            style.name.toLowerCase() &&
          String(
            p.category || ""
          ).toLowerCase() ===
            style.category.toLowerCase()
      );

    if (!pattern) {
      const result =
        await apiRequest(
          "/api/patterns",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                name:
                  style.name,

                category:
                  style.category
              })
          }
        );

      pattern =
        result.pattern ||
        result;

      state.patterns.push(
        pattern
      );
    }

    const alreadyLinked =
      linked.some(
        p =>
          Number(
            p.pattern_id ||
            p.id
          ) ===
          Number(pattern.id)
      );

    if (!alreadyLinked) {
      await apiRequest(
        "/api/product-patterns",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              product_id:
                Number(
                  productId
                ),

              pattern_id:
                Number(
                  pattern.id
                )
            })
        }
      );

      linked.push({
        ...pattern,
        pattern_id:
          pattern.id
      });
    }
  }

  const desiredKeys =
    new Set(
      desired.map(
        style =>
          `${style.category.toLowerCase()}|${style.name.toLowerCase()}`
      )
    );

  for (
    const pattern of linked
  ) {
    const key =
      `${String(
        pattern.category ||
        ""
      ).toLowerCase()}|${String(
        pattern.name ||
        ""
      ).toLowerCase()}`;

    if (
      !desiredKeys.has(key)
    ) {
      await apiRequest(
        `/api/products/${productId}/patterns/${
          pattern.pattern_id ||
          pattern.id
        }`,
        {
          method:
            "DELETE"
        }
      );
    }
  }
}


// ============================================================
// GET PATTERN IDS FOR SELECTED WIZARD STYLES
// ============================================================

async function getSelectedPatternIds(
  productId,
  selectedStyles
) {
  if (
    !selectedStyles ||
    !selectedStyles.length
  ) {
    return [];
  }

  await syncProductStyles(
    productId,
    state.products.find(
      p =>
        Number(p.id) ===
        Number(productId)
    )?.styles || ""
  );

  const linked =
    await loadProductPatterns(
      productId
    );

  const ids = [];

  for (
    const selected of
    selectedStyles
  ) {
    const index =
      selected.indexOf(":");

    if (index === -1) {
      continue;
    }

    const category =
      selected
        .slice(0, index)
        .trim();

    const name =
      selected
        .slice(index + 1)
        .trim();

    const pattern =
      linked.find(
        p =>
          String(
            p.category ||
            ""
          ).toLowerCase() ===
            category.toLowerCase() &&
          String(
            p.name ||
            ""
          ).toLowerCase() ===
            name.toLowerCase()
      );

    if (pattern) {
      ids.push(
        Number(
          pattern.pattern_id ||
          pattern.id
        )
      );
    }
  }

  return ids;
}


// ============================================================
// GET COMPLETE ORDER
// ============================================================

async function getCompleteOrder(
  order
) {
  if (!order) {
    return null;
  }

  try {
    const data =
      await apiRequest(
        `/api/orders/${order.id}`
      );

    state.orderDetails[
      order.id
    ] = data;

    const firstItem =
      data.items?.[0];

    if (firstItem) {
      order.garment =
        firstItem.product_name ||
        "";

      order.qty =
        Number(
          firstItem.quantity ||
          1
        );

      order.price =
        Number(
          firstItem.price ||
          0
        );

      order.staff =
        firstItem.staff_name ||
        order.staff ||
        "";

      order.staffId =
        firstItem.staff_id;

      order.measurementId =
        firstItem.measurement_id;

      order.styles =
        (firstItem.patterns || [])
          .map(
            p =>
              `${p.category}: ${p.name}`
          );

      const measurementValues =
        {};

      const mappings = [
        [
          "Chest",
          firstItem.chest
        ],
        [
          "Waist",
          firstItem.waist
        ],
        [
          "Shoulder",
          firstItem.shoulder
        ],
        [
          "Sleeve",
          firstItem.sleeve
        ],
        [
          "Length",
          firstItem.length
        ],
        [
          "Neck",
          firstItem.neck
        ],
        [
          "Arm Hole",
          firstItem.arm_hole
        ],
        [
          "Seat",
          firstItem.seat
        ],
        [
          "Thigh",
          firstItem.thigh
        ],
        [
          "Knee",
          firstItem.knee
        ],
        [
          "Bottom",
          firstItem.bottom
        ],
        [
          "Outseam",
          firstItem.outseam
        ],
        [
          "Inseam",
          firstItem.inseam
        ]
      ];

      for (
        const [key, value]
        of mappings
      ) {
        if (
          value !== null &&
          value !== undefined
        ) {
          measurementValues[key] =
            Number(value);
        }
      }

      order.measurements =
        measurementValues;

      order.measurementNotes =
        firstItem.measurement_notes ||
        "";

      order.orderItemId =
        firstItem.id;
    }

    return data;

  } catch (error) {
    console.error(
      "Order detail error:",
      error
    );

    toast(
      "Could not load order details."
    );

    return null;
  }
}


// ============================================================
// ORIGINAL UI HELPERS
// ============================================================

function action(
  label,
  name,
  id = "",
  cls = "outline"
) {
  return `
    <button
      type="button"
      class="${cls}"
      data-action="${name}"
      data-id="${escapeHTML(id)}"
    >
      ${escapeHTML(label)}
    </button>
  `;
}


function inputField(
  label,
  name,
  value = "",
  type = "text",
  attrs = ""
) {
  return `
    <div class="field">

      <label for="f-${name}">
        ${escapeHTML(label)}
      </label>

      <input
        id="f-${name}"
        name="${name}"
        value="${escapeHTML(value)}"
        type="${type}"
        ${attrs}
      >

    </div>
  `;
}


function textField(
  label,
  name,
  value = "",
  attrs = ""
) {
  return `
    <div class="field">

      <label for="f-${name}">
        ${escapeHTML(label)}
      </label>

      <textarea
        id="f-${name}"
        name="${name}"
        ${attrs}
      >${escapeHTML(value)}</textarea>

    </div>
  `;
}


function selectField(
  label,
  name,
  options,
  value = "",
  attrs = ""
) {
  return `
    <div class="field">

      <label for="f-${name}">
        ${escapeHTML(label)}
      </label>

      <select
        id="f-${name}"
        name="${name}"
        ${attrs}
      >

        ${options.map(option => {
          const [v, t] =
            Array.isArray(option)
              ? option
              : [
                  option,
                  option
                ];

          return `
            <option
              value="${escapeHTML(v)}"
              ${
                String(value) ===
                String(v)
                  ? "selected"
                  : ""
              }
            >
              ${escapeHTML(t)}
            </option>
          `;
        }).join("")}

      </select>

    </div>
  `;
}


function closeDialog() {
  $("#modalRoot").innerHTML =
    "";

  document.body.classList.remove(
    "modal-open"
  );

  if (
    returnFocus?.isConnected
  ) {
    returnFocus.focus();
  }
}


function dialog(
  title,
  body,
  form = "",
  id = ""
) {
  returnFocus =
    document.activeElement;

  $("#modalRoot").innerHTML = `
    <div class="modal-backdrop">

      <section
        class="panel modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialogTitle"
      >

        <div class="panel-head">

          <h2
            class="panel-title"
            id="dialogTitle"
          >
            ${escapeHTML(title)}
          </h2>

          ${action(
            "✕",
            "close-dialog",
            "",
            "ghost"
          )}

        </div>

        ${
          form
            ? `
              <form
                data-form="${form}"
                data-id="${escapeHTML(id)}"
                class="panel-body"
              >

                ${body}

                <p
                  class="form-error"
                  role="alert"
                ></p>

                <div class="modal-actions">

                  ${action(
                    "Cancel",
                    "close-dialog"
                  )}

                  <button
                    class="primary"
                    type="submit"
                  >
                    Save
                  </button>

                </div>

              </form>
            `
            : `
              <div class="panel-body">
                ${body}
              </div>
            `
        }

      </section>

    </div>
  `;

  document.body.classList.add(
    "modal-open"
  );

  $("#modalRoot")
    .querySelector(
      "input,select,textarea,button"
    )
    ?.focus();
}


function rowsTable(
  head,
  rows
) {
  return `
    <div class="panel table-wrap">

      <table>

        <thead>

          <tr>
            ${head.map(
              h =>
                `<th>${h}</th>`
            ).join("")}
          </tr>

        </thead>

        <tbody>

          ${
            rows.join("") ||
            `
              <tr>

                <td
                  colspan="${head.length}"
                  class="empty"
                >
                  No matching records.
                </td>

              </tr>
            `
          }

        </tbody>

      </table>

    </div>
  `;
}


function searchBox() {
  return `
    <div class="search">
      ⌕
      <input
        data-search
        aria-label="Search records"
        placeholder="Search records"
      >
    </div>
  `;
}


function detailRows(rows) {
  return rows.map(
    ([key, value]) => `
      <div class="summary-row">

        <span>
          ${escapeHTML(key)}
        </span>

        <strong>
          ${escapeHTML(
            value ?? "—"
          )}
        </strong>

      </div>
    `
  ).join("");
}


// ============================================================
// CUSTOMER UI - SAME AS BEFORE
// ============================================================

function customerDialog(id) {
  const c =
    state.customers.find(
      c =>
        c.id == id
    ) || {};

  dialog(
    c.id
      ? "Edit Customer"
      : "Add Customer",

    `
      <div class="form-grid">

        ${inputField(
          "Name",
          "name",
          c.name,
          "text",
          'required maxlength="80"'
        )}

        ${inputField(
          "Mobile Number",
          "phone",
          c.phone,
          "tel",
          'required pattern="[0-9]{10}" maxlength="10" title="Enter a 10-digit mobile number"'
        )}

        ${inputField(
          "City",
          "city",
          c.city ||
          "Hubballi",
          "text",
          "required"
        )}

        ${inputField(
          "Alternate Number",
          "alternate",
          c.alternate,
          "tel",
          'pattern="[0-9]{10}" maxlength="10"'
        )}

      </div>

      ${textField(
        "Address",
        "address",
        c.address
      )}
    `,

    "customer",
    id
  );
}


showAddCustomer =
  () =>
    customerDialog();


customers = () => `
  <div class="toolbar">

    ${searchBox()}

    ${action(
      "+ Add Customer",
      "add-customer",
      "",
      "primary"
    )}

  </div>

  ${rowsTable(
    [
      "Customer",
      "Mobile",
      "City",
      "Orders",
      "Actions"
    ],

    state.customers.map(
      c => `
        <tr data-record>

          <td>
            <strong>
              ${escapeHTML(
                c.name
              )}
            </strong>
          </td>

          <td>
            ${escapeHTML(
              c.phone
            )}
          </td>

          <td>
            ${escapeHTML(
              c.city
            )}
          </td>

          <td>
            ${
              state.orders.filter(
                o =>
                  Number(
                    o.customerId
                  ) ===
                  Number(c.id)
              ).length
            }
          </td>

          <td>

            <div class="row-actions">

              ${action(
                "View",
                "customer-view",
                c.id
              )}

              ${action(
                "Edit",
                "customer-edit",
                c.id
              )}

              ${action(
                "New Order",
                "customer-order",
                c.id
              )}

            </div>

          </td>

        </tr>
      `
    )
  )}
`;


// ============================================================
// PRODUCT UI - SAME AS BEFORE
// ============================================================

function productDialog(id) {
  const p =
    state.products.find(
      p =>
        p.id == id
    ) || {};

  dialog(
    p.id
      ? "Edit Product & Styles"
      : "Add Product",

    `
      <div class="form-grid">

        ${inputField(
          "Name",
          "name",
          p.name,
          "text",
          'required maxlength="60"'
        )}

        ${selectField(
          "Type",
          "type",
          [
            "Top",
            "Bottom",
            "Both",
            "Other"
          ],
          p.type
        )}

        ${inputField(
          "Unit Price",
          "price",
          p.price ?? 0,
          "number",
          'required min="0" step="0.01"'
        )}

      </div>

      ${textField(
        "Style groups (one per line: Group: Option, Option)",
        "styles",
        p.styles ||
        "Fit: Regular, Comfort",
        "required"
      )}
    `,

    "product",
    id
  );
}


products = () => `
  <div class="toolbar">

    ${searchBox()}

    ${action(
      "+ Add Product",
      "product-add",
      "",
      "primary"
    )}

  </div>

  ${rowsTable(
    [
      "Product",
      "Type",
      "Price",
      "Actions"
    ],

    state.products.map(
      p => `
        <tr data-record>

          <td>
            <strong>
              ${escapeHTML(
                p.name
              )}
            </strong>
          </td>

          <td>
            ${escapeHTML(
              p.type
            )}
          </td>

          <td>
            ${money(
              p.price
            )}
          </td>

          <td>

            <div class="row-actions">

              ${action(
                "Manage Styles",
                "product-edit",
                p.id
              )}

              ${action(
                "Edit",
                "product-edit",
                p.id
              )}

            </div>

          </td>

        </tr>
      `
    )
  )}
`;


// ============================================================
// STAFF UI - SAME AS BEFORE
// ============================================================

function staffDialog(id) {
  const s =
    state.staff.find(
      s =>
        s.id == id
    ) || {};

  dialog(
    s.id
      ? "Edit Staff"
      : "Add Staff",

    `
      <div class="form-grid">

        ${inputField(
          "Name",
          "name",
          s.name,
          "text",
          'required maxlength="80"'
        )}

        ${selectField(
          "Role",
          "role",
          masterOptions(
          "staff_role",
          [
            "Tailor",
            "Master Cutter",
            "Finishing",
            "Administrator"
          ]
        ),
          s.role
        )}

        ${inputField(
          "Mobile Number",
          "phone",
          s.phone,
          "tel",
          'required pattern="[0-9]{10}" maxlength="10"'
        )}

      </div>
    `,

    "staff",
    id
  );
}


staff = () => `
  <div class="toolbar">

    ${searchBox()}

    ${action(
      "+ Add Staff",
      "staff-add",
      "",
      "primary"
    )}

  </div>

  <div class="grid staff-grid">

    ${state.staff.map(
      s => `
        <div
          class="panel panel-body"
          data-record
        >

          <strong>
            ${escapeHTML(
              s.name
            )}
          </strong>

          <p class="small muted">
            ${escapeHTML(
              s.role
            )}
            ·
            ${escapeHTML(
              s.phone
            )}
          </p>

          <div class="summary-row">

            <span>
              Pending Jobs
            </span>

            <strong>
              ${
                state.orders.filter(
                  o =>
                    o.staff
                      .split(",")
                      .map(
                        value =>
                          value.trim()
                      )
                      .includes(
                        s.name
                      ) &&
                    o.status !==
                    "Delivered"
                ).length
              }
            </strong>

          </div>

          ${action(
            "View Work Queue",
            "staff-queue",
            s.id
          )}

          ${action(
            "Edit",
            "staff-edit",
            s.id
          )}

        </div>
      `
    ).join("")}

  </div>
`;


// ============================================================
// MEASUREMENT UI - SAME AS BEFORE
// ============================================================

function measurementNames(g) {
  const product = state.products.find(p => p.name === g);
  return String(g).toLowerCase() === "pant" || String(product?.type).toLowerCase() === "bottom"
    ? [
        "Waist",
        "Seat",
        "Thigh",
        "Knee",
        "Bottom",
        "Outseam",
        "Inseam"
      ]
    : [
        "Chest",
        "Waist",
        "Shoulder",
        "Sleeve",
        "Length",
        "Neck",
        "Arm Hole"
      ];
}


function measurementFields(
  garment,
  values = {},
  draft = false
) {
  return measurementNames(
    garment
  )
    .map(
      field =>
        inputField(
          `${field} (inches)`,
          `measure_${field}`,
          values[field] ?? "",
          "number",
          `required min="0.1" max="150" step="0.1" ${
            draft
              ? `data-measure="${field}"`
              : ""
          }`
        )
    )
    .join("");
}


function measurementDialog(id) {
  if (
    !state.customers.length ||
    !state.products.length
  ) {
    return toast(
      "Add a customer and product first."
    );
  }

  const m =
    state.measurements.find(
      m =>
        m.id == id
    ) || {
      garment:
        state.products[0].name,

      values: {}
    };

  dialog(
    m.id
      ? "Edit Measurements"
      : "Add Measurements",

    `
      <div class="form-grid">

        ${selectField(
          "Customer",
          "customerId",
          state.customers.map(
            c => [
              c.id,
              c.name
            ]
          ),
          m.customerId,
          "required"
        )}

        ${selectField(
          "Garment",
          "garment",
          state.products.map(
            p =>
              p.name
          ),
          m.garment,
          "data-measure-garment"
        )}

        ${inputField(
          "Profile",
          "profile",
          m.profile ||
          "Regular Fit",
          "text",
          "required"
        )}

      </div>

      <div
        id="measureFields"
        class="form-grid three"
      >

        ${measurementFields(
          m.garment,
          m.values
        )}

      </div>

      ${textField(
        "Notes",
        "notes",
        m.notes
      )}
    `,

    "measurement",
    id
  );
}


measurements = () => `
  <div class="toolbar">

    ${searchBox()}

    ${action(
      "+ Add Profile",
      "measurement-add",
      "",
      "primary"
    )}

  </div>

  ${rowsTable(
    [
      "Customer",
      "Garment",
      "Profile",
      "Updated",
      "Actions"
    ],

    state.measurements.map(
      m => `
        <tr data-record>

          <td>
            ${
              escapeHTML(
                state.customers.find(
                  c =>
                    Number(c.id) ===
                    Number(
                      m.customerId
                    )
                )?.name ||
                "Unknown"
              )
            }
          </td>

          <td>
            ${escapeHTML(
              m.garment
            )}
          </td>

          <td>
            ${escapeHTML(
              m.profile
            )}
          </td>

          <td>
            ${escapeHTML(
              m.updated
            )}
          </td>

          <td>

            <div class="row-actions">

              ${action(
                "View",
                "measurement-view",
                m.id
              )}

              ${action(
                "Edit",
                "measurement-edit",
                m.id
              )}

            </div>

          </td>

        </tr>
      `
    )
  )}
`;


// ============================================================
// ORDER TABLE UI - SAME AS BEFORE
// ============================================================

orderRow = (
  o,
  actions = true
) => `
  <tr
    data-record
    data-status="${escapeHTML(
      o.status
    )}"
    data-staff="${escapeHTML(
      o.staff
    )}"
    data-phone="${escapeHTML(
      o.customerMobile ||
      state.customers.find(
        c =>
          Number(c.id) ===
          Number(
            o.customerId
          )
      )?.phone ||
      ""
    )}"
  >

    <td>
      <strong>
        ${escapeHTML(
          o.no
        )}
      </strong>
    </td>

    <td>
      ${escapeHTML(
        o.customer
      )}
    </td>

    <td>
      ${escapeHTML(
        o.items
      )}
    </td>

    <td>
      <span
        class="status ${statusClass(
          o.status
        )}"
      >
        ${escapeHTML(
          o.status
        )}
      </span>
    </td>

    <td>
      ${escapeHTML(
        o.staff
      )}
    </td>

    <td>
      ${escapeHTML(
        o.deliveryDate ||
        o.delivery
      )}
    </td>

    ${
      actions
        ? `
          <td>
            ${money(
              o.total
            )}
          </td>

          <td>

            <div class="row-actions">

              ${action(
                "View",
                "order-view",
                o.id
              )}

              ${action(
                "Edit",
                "order-edit",
                o.id
              )}

              ${action(
                "Duplicate",
                "order-duplicate",
                o.id
              )}

            </div>

          </td>
        `
        : ""
    }

  </tr>
`;


orders = () => `
  <div class="toolbar">

    ${searchBox()}

    <div class="filters">

      <select
        data-filter="status"
        aria-label="Filter by status"
      >

        <option>
          All Status
        </option>

        ${
          [
            ...stages,
          ].map(
            s =>
              `<option>${s}</option>`
          ).join("")
        }

      </select>

      <select
        data-filter="staff"
        aria-label="Filter by staff"
      >

        <option>
          All Staff
        </option>

        ${
          state.staff.map(
            s => `
              <option>
                ${escapeHTML(
                  s.name
                )}
              </option>
            `
          ).join("")
        }

      </select>

      ${action(
        "+ New Order",
        "new-order",
        "",
        "primary"
      )}

    </div>

  </div>

  ${rowsTable(
    [
      "Order",
      "Customer",
      "Items",
      "Status",
      "Staff",
      "Delivery",
      "Amount",
      "Actions"
    ],

    state.orders.map(
      o =>
        orderRow(o)
    )
  )}
`;


// ============================================================
// PRODUCTION UI - SAME AS BEFORE
// ============================================================

production = () => `
  <div class="toolbar">

    ${searchBox()}

    <div class="filters">

      <select
        data-filter="staff"
        aria-label="Filter by staff"
      >

        <option>
          All Staff
        </option>

        ${
          state.staff.map(
            s => `
              <option>
                ${escapeHTML(
                  s.name
                )}
              </option>
            `
          ).join("")
        }

      </select>

    </div>

  </div>

  <div class="kanban">

    ${
      stages.map(stage => {
        const list =
          state.orders.filter(
            order =>
              (
                order.status ===
                "Overdue"
                  ? "Cutting"
                  : order.status
              ) ===
              stage
          );

        return `
          <div class="kanban-col">

            <div class="kanban-title">

              ${stage}

              <span>
                ${list.length}
              </span>

            </div>

            ${
              list.map(
                order => `
                  <div
                    class="kanban-card"
                    data-record
                    data-staff="${escapeHTML(
                      order.staff
                    )}"
                  >

                    <strong>
                      ${escapeHTML(
                        order.no
                      )}
                      ·
                      ${escapeHTML(
                        order.customer
                      )}
                    </strong>

                    <div class="meta">
                      ${escapeHTML(
                        order.items
                      )}
                    </div>

                    <span class="staff-pill">
                      ${escapeHTML(
                        order.staff
                      )}
                    </span>

                    <div class="due">
                      Due:
                      ${escapeHTML(
                        order.deliveryDate ||
                        order.delivery
                      )}
                    </div>

                    ${action(
                      "View",
                      "order-view",
                      order.id,
                      "ghost"
                    )}

                    ${
                      stage ===
                      "Delivered"
                        ? ""
                        : action(
                            "Move forward →",
                            "stage-advance",
                            order.id,
                            "ghost"
                          )
                    }

                  </div>
                `
              ).join("") ||
              `
                <div class="empty small">
                  No jobs
                </div>
              `
            }

          </div>
        `;
      }).join("")
    }

  </div>
`;


function masterConfigLabel(type) {
  const labels = {
    order_status: "Order Status",
    priority: "Priority",
    payment_method: "Payment Method",
    staff_role: "Staff Role"
  };

  return labels[type] || type;
}


function masterConfigRows(type) {
  const rows =
    state.masterConfig?.[type] || [];

  return rows.map(item => `
    <tr data-record>

      <td>
        ${escapeHTML(item.config_value)}
      </td>

      <td>
        ${escapeHTML(item.config_key)}
      </td>

      <td>
        ${item.active ? "Active" : "Inactive"}
      </td>

      <td>
        <div class="row-actions">

          ${action(
            "Edit",
            "master-config-edit",
            item.id
          )}

          ${action(
            item.active
              ? "Disable"
              : "Enable",
            "master-config-toggle",
            item.id
          )}

        </div>
      </td>

    </tr>
  `);
}


function masterConfigDialog(id = "") {
  let item = null;

  if (id) {
    for (
      const type in state.masterConfig
    ) {
      item =
        state.masterConfig[type].find(
          row =>
            Number(row.id) ===
            Number(id)
        );

      if (item) {
        break;
      }
    }
  }

  dialog(
    item
      ? "Edit Master Config"
      : "Add Master Config",

    `
      <div class="form-grid">

        ${selectField(
          "Config Type",
          "config_type",
          [
            ["order_status", "Order Status"],
            ["priority", "Priority"],
            ["payment_method", "Payment Method"],
            ["staff_role", "Staff Role"]
          ],
          item?.config_type || "",
          "required"
        )}

        ${inputField(
          "Display Value",
          "config_value",
          item?.config_value || "",
          "text",
          'required maxlength="100"'
        )}

        ${inputField(
          "Config Key",
          "config_key",
          item?.config_key || "",
          "text",
          'required maxlength="100"'
        )}

        ${inputField(
          "Display Order",
          "display_order",
          item?.display_order ?? 0,
          "number",
          'min="0" step="1"'
        )}

      </div>
    `,

    "master-config",
    id
  );
}


// ============================================================
// PAYMENTS
// ============================================================

payments = () => {

  const totalReceived =
    state.payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount || 0
        ),
      0
    );

  const today =
    todayISO();

  const todayReceived =
    state.payments
      .filter(
        payment =>
          String(
            payment.payment_date || ""
          ).slice(0, 10) ===
          today
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );

  const cashReceived =
    state.payments
      .filter(
        payment =>
          String(
            payment.payment_method
          ).toLowerCase() ===
          "cash"
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );

  const upiReceived =
    state.payments
      .filter(
        payment =>
          String(
            payment.payment_method
          ).toLowerCase() ===
          "upi"
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );

  const outstanding =
    state.orders.reduce(
      (sum, order) =>
        sum +
        Math.max(
          0,
          Number(order.total || 0) -
          Number(order.advance || 0)
        ),
      0
    );

  return `
    <div class="grid report-stats">

      ${
        [
          [
            "Total Received",
            money(totalReceived)
          ],
          [
            "Today's Collection",
            money(todayReceived)
          ],
          [
            "UPI Collection",
            money(upiReceived)
          ],
          [
            "Cash Collection",
            money(cashReceived)
          ],
          [
            "Outstanding",
            money(outstanding)
          ]
        ].map(
          item => `
            <div class="stat">

              <div class="label">
                ${item[0]}
              </div>

              <div class="value">
                ${item[1]}
              </div>

            </div>
          `
        ).join("")
      }

    </div>

    <div
      class="panel"
      style="margin-top:18px"
    >

      <div class="panel-head">

        <div class="panel-title">
          Payment History
        </div>

      </div>

      ${rowsTable(
        [
          "Payment",
          "Order",
          "Customer",
          "Amount",
          "Method",
          "Date",
          "Note",
          "Balance",
          "Action"
        ],

        state.payments.map(
          payment => `
            <tr data-record>

              <td>
                #${escapeHTML(
                  payment.id
                )}
              </td>

              <td>
                <strong>
                  ${escapeHTML(
                    payment.order_number
                  )}
                </strong>
              </td>

              <td>
                ${escapeHTML(
                  payment.customer_name
                )}
              </td>

              <td>
                ${money(
                  Number(
                    payment.amount || 0
                  )
                )}
              </td>

              <td>
                ${escapeHTML(
                  payment.payment_method ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  String(
                    payment.payment_date ||
                    ""
                  ).slice(0, 10)
                )}
              </td>

              <td>
                ${escapeHTML(
                  payment.note ||
                  "—"
                )}
              </td>

              <td>
                ${money(
                  Number(
                    payment.balance_amount ||
                    0
                  )
                )}
              </td>

              <td>
                ${action(
                  "View Order",
                  "order-view",
                  payment.order_id
                )}
              </td>

            </tr>
          `
        )
      )}

    </div>
  `;
};

// ============================================================
// SETTINGS UI - SAME AS BEFORE
// ============================================================

settings = () => `
  <div
    class="panel"
    style="max-width:720px"
  >

    <div class="panel-head">

      <div class="panel-title">
        Store Settings
      </div>

    </div>

    <form
      data-form="settings"
      class="panel-body"
    >

      <div class="form-grid">

        ${inputField(
          "Store Name",
          "name",
          state.settings.name,
          "text",
          'required maxlength="80"'
        )}

        ${inputField(
          "Phone",
          "phone",
          state.settings.phone,
          "tel",
          'required pattern="[0-9+ ()-]{10,20}"'
        )}

        ${inputField(
          "Order Prefix",
          "prefix",
          state.settings.prefix,
          "text",
          'required pattern="[A-Za-z]{1,8}"'
        )}

        ${inputField(
          "Default Delivery Days",
          "days",
          state.settings.days,
          "number",
          'required min="0" max="365"'
        )}

      </div>

      ${textField(
        "Address",
        "address",
        state.settings.address
      )}

      <p
        class="form-error"
        role="alert"
      ></p>

      <button
        class="primary"
        type="submit"
      >
        Save Settings
      </button>

    </form>

  </div>


  <div
    class="panel"
    style="margin-top:20px"
  >

    <div class="panel-head">

      <div>

        <div class="panel-title">
          Master Config
        </div>

        <div class="small muted">
          Manage dropdown values used across the software.
        </div>

      </div>

      ${action(
        "+ Add Config",
        "master-config-add",
        "",
        "primary"
      )}

    </div>

    <div class="panel-body">

      ${[
        "order_status",
        "priority",
        "payment_method",
        "staff_role"
      ].map(type => `

        <div style="margin-bottom:24px">

          <div
            class="section-label"
            style="margin-bottom:10px"
          >
            ${escapeHTML(
              masterConfigLabel(type)
            )}
          </div>

          ${rowsTable(
            [
              "Value",
              "Key",
              "Status",
              "Actions"
            ],
            masterConfigRows(type)
          )}

        </div>

      `).join("")}

    </div>

  </div>
`;


// ============================================================
// ORDER DETAIL
// ============================================================

async function orderDetail(id) {
  const o =
    state.orders.find(
      order =>
        Number(order.id) ===
        Number(id)
    );

  if (!o) {
    return;
  }

  await getCompleteOrder(o);

  lastOrder =
    o.no;

  dialog(
    `Order ${o.no}`,

    detailRows([
      [
        "Customer",
        o.customer
      ],

      [
        "Items",
        o.items
      ],

      [
        "Status",
        o.status
      ],

      [
        "Staff",
        o.staff
      ],

      [
        "Trial",
        o.trial ||
        "—"
      ],

      [
        "Delivery",
        o.deliveryDate ||
        o.delivery
      ],

      [
        "Total",
        money(
          o.total
        )
      ],

      [
        "Advance",
        money(
          o.advance
        )
      ],

      [
        "Balance",
        money(
          o.total -
          o.advance
        )
      ],

      [
        "Styles",
        (
          o.styles ||
          []
        ).join(", ") ||
        "Standard"
      ],

      [
        "Notes",
        o.notes ||
        "—"
      ],

      ...Object.entries(
        o.measurements ||
        {}
      ).map(
        ([key, value]) => [
          key,
          `${value} in`
        ]
      )
    ])

    +

    `
      <div class="modal-actions">

        ${action(
          "Edit",
          "order-edit",
          o.id
        )}

        ${action(
          "Print Receipt",
          "receipt-print",
          o.id
        )}

        ${action(
          "WhatsApp Receipt",
          "receipt-share",
          o.id
        )}

      </div>
    `
  );
}


// ============================================================
// EDIT ORDER UI - SAME AS BEFORE
// ============================================================

async function orderDialog(id) {
  const o =
    state.orders.find(
      order =>
        Number(order.id) ===
        Number(id)
    );

  if (!o) {
    return;
  }

  await getCompleteOrder(o);

  dialog(
    `Edit Order ${o.no}`,

    `
      <div class="form-grid">

        ${selectField(
          "Status",
          "status",
          [
            ...stages,
            "Overdue"
          ],
          o.status
        )}

        ${selectField(
          "Staff",
          "staff",
          [
            ...new Set([
              o.staff,
              ...state.staff.map(
                s =>
                  s.name
              )
            ])
          ].filter(Boolean),
          o.staff
        )}

        ${inputField(
          "Trial",
          "trial",
          o.trial,
          "date"
        )}

        ${inputField(
          "Delivery",
          "deliveryDate",
          o.deliveryDate,
          "date",
          "required"
        )}

        ${inputField(
          "Total",
          "total",
          o.total,
          "number",
          'required min="0" step="0.01"'
        )}

        ${inputField(
          "Advance",
          "advance",
          o.advance,
          "number",
          'required min="0" step="0.01"'
        )}

      </div>

      ${textField(
        "Notes",
        "notes",
        o.notes
      )}
    `,

    "order",
    o.id
  );
}


// ============================================================
// ORDER WIZARD - SAME UI
// ============================================================

const originalOpenWizard =
  openWizard;


frame = (
  title,
  sub,
  body,
  next = "Continue"
) => `
  <form
    data-form="wizard"
    class="wizard-form"
  >

    <div class="wizard-head">

      <h2>
        ${escapeHTML(title)}
      </h2>

      <p>
        ${escapeHTML(sub)}
      </p>

    </div>

    <div class="wizard-body">
      ${body}
    </div>

    <div class="wizard-foot">

      ${action(
        state.wizardStep === 0
          ? "Cancel"
          : "← Back",

        state.wizardStep === 0
          ? "wizard-cancel"
          : "wizard-back",

        "",
        "ghost"
      )}

      <button
        type="submit"
        class="primary"
      >
        ${escapeHTML(next)} →
      </button>

    </div>

  </form>
`;


openWizard = () => {
  closeDialog();

  originalOpenWizard();

  const draft =
    state.orderDraft;

  const date =
    new Date(
      todayISO() +
      "T12:00:00"
    );

  date.setDate(
    date.getDate() +
    Number(
      state.settings.days ||
      5
    )
  );

  Object.assign(
    draft,
    {
      trial:
        todayISO(),

      delivery:
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(
          date.getDate()
        ).padStart(2, "0")}`,

      staff:
        state.staff[0]?.name ||
        "",

      staffId:
        state.staff[0]?.id ||
        null,

      priority:
        "Normal",

      paymentMethod:
        "UPI",

      measureMode:
        "new",

      measurementId:
        null,

      measurements: {},

      measurementNotes:
        "",

      styles: []
    }
  );

  renderWizard();
};


stepCustomer = () => {

  const selectedId =
    state.orderDraft.customer?.id;

  return frame(
    "Select Customer",

    "Choose an existing customer or add a new one.",

    `
      <div class="toolbar">

        <div></div>

        ${action(
          "+ Add Customer",
          "add-customer",
          "",
          "primary"
        )}

      </div>

      <div class="panel table-wrap">

        <table>

          <thead>

            <tr>

              <th>
                Customer
              </th>

              <th>
                Mobile
              </th>

              <th>
                City
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            ${
              state.customers.length
                ? state.customers.map(
                    customer => {

                      const selected =
                        Number(selectedId) ===
                        Number(customer.id);

                      return `
                        <tr
                          data-record
                          data-action="wizard-select-customer"
                          data-id="${customer.id}"
                          style="cursor:pointer"
                          ${
                            selected
                              ? 'class="selected-row"'
                              : ""
                          }
                        >

                          <td>

                            <strong>
                              ${escapeHTML(
                                customer.name
                              )}
                            </strong>

                          </td>

                          <td>
                            ${escapeHTML(
                              customer.phone
                            )}
                          </td>

                          <td>
                            ${escapeHTML(
                              customer.city
                            )}
                          </td>

                          <td>

                            <span
                              style="
                                font-size:13px;
                                font-weight:600;
                                cursor:pointer;
                              "
                            >
                              ${
                                selected
                                  ? "Selected ✓"
                                  : "Select →"
                              }
                            </span>

                          </td>

                        </tr>
                      `;
                    }
                  ).join("")

                : `
                  <tr>

                    <td
                      colspan="4"
                      class="empty"
                    >
                      No customers found.
                    </td>

                  </tr>
                `
            }

          </tbody>

        </table>

      </div>
    `
  );
};


stepGarment = () =>
  frame(
    "Choose Garment",

    "Choose a product and quantity.",

    `
      ${selectField(
        "Garment",
        "garment",
        [
          [
            "",
            "Select a garment"
          ],

          ...state.products.map(
            p =>
              p.name
          )
        ],
        state.orderDraft.garment,
        "data-wizard-garment required"
      )}

      ${inputField(
        "Quantity",
        "qty",
        state.orderDraft.qty,
        "number",
        'required min="1" step="1" data-bind="qty"'
      )}
    `
  );


async function loadWizardMeasurementProfiles(draft = state.orderDraft) {
  const product = state.products.find(p => p.name === draft.garment);
  if (!draft.customer || !product) throw new Error("Select a customer and garment first.");
  const key = `${draft.customer.id}:${product.id}`;
  draft.measurementProfilesKey = null;
  let rows;
  try {
    rows = await apiRequest(
      `/api/customers/${draft.customer.id}/products/${product.id}/measurements`
    );
  } catch (error) {
    if (error.status !== 404) throw error;
    // Support the existing backend process until it loads the new route.
    rows = await apiRequest(`/api/customers/${draft.customer.id}/measurements`);
  }
  if (state.orderDraft !== draft || `${draft.customer?.id}:${state.products.find(p => p.name === draft.garment)?.id}` !== key) return false;
  draft.measurementProfiles = rows
    .filter(m => Number(m.customer_id) === Number(draft.customer.id) && Number(m.product_id) === Number(product.id))
    .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0) || Number(b.id) - Number(a.id))
    .map(mapMeasurement);
  draft.measurementProfilesKey = key;
  if (draft.measureMode !== "new" && !draft.measurementProfiles.some(m => m.id === draft.measurementId)) {
    draft.measureMode = "new";
    draft.measurementId = null;
    draft.measurements = {};
    draft.measurementNotes = "";
  }
  return true;
}

stepMeasurements = () => {
  const draft = state.orderDraft;
  const profiles = draft.measurementProfiles || [];
  const previous = draft.measureMode !== "new";
  const card = (mode, title, subtitle) => `
    <button type="button" class="choice-card ${(mode === "previous" ? previous : draft.measureMode === mode) ? "selected" : ""}"
      style="text-align:left;width:100%" data-action="wizard-measurement-source" data-id="${mode}"
      aria-pressed="${mode === "previous" ? previous : draft.measureMode === mode}">
      <strong>${escapeHTML(title)}</strong><small>${escapeHTML(subtitle)}</small>
    </button>`;
  return frame("Measurements", "Measurements are saved with this order.", `
    <div class="choice-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      ${card("new", "New Measurements", draft.measureMode === "new" ? "Selected \u2713" : "Take new measurements for this order")}
      ${card("previous", "Existing Measurements", previous ? "Selected \u2713" : profiles.length ? "Choose a saved profile" : "No saved measurements for this customer and garment")}
    </div>
    ${profiles.length && previous ? `
      <div class="section-label">Previous measurement profiles</div>
      <div class="customer-results">
        ${profiles.map(m => card(`profile:${m.id}`, m.profile,
          `Saved ${m.updated || "date unavailable"} \u00b7 ${draft.measurementId === m.id ? "Selected \u2713" : "Use Previous Measurements \u2192"}`)).join("")}
      </div>` : ""}
    ${previous && !profiles.length ? `<p class="small muted">No existing measurements found for this customer and garment. Select New Measurements to continue.</p>` : ""}
    ${draft.measureMode === "new" ? `
      <div class="section-label">${escapeHTML(draft.garment)} measurements (inches)</div>
      <div class="form-grid three">${measurementFields(draft.garment, draft.measurements, true)}</div>
      ${textField("Measurement Notes", "measurementNotes", draft.measurementNotes, 'data-bind="measurementNotes"')}
    ` : draft.measurementId ? `
      <div class="section-label">Saved measurements (inches)</div>
      <table class="measure-table"><tbody>
        ${measurementNames(draft.garment).map(name => `<tr><td>${escapeHTML(name)}</td><td>${escapeHTML(String(draft.measurements[name] ?? "\u2014"))}</td></tr>`).join("")}
      </tbody></table>
      ${draft.measurementNotes ? `<p class="small muted">${escapeHTML(draft.measurementNotes)}</p>` : ""}
    ` : ""}
  `);
};


stepStyles = () => {
  const draft =
    state.orderDraft;

  const product =
    state.products.find(
      p =>
        p.name ===
        draft.garment
    );

  return frame(
    "Style & Design",

    "Choose one option per group.",

    styleGroups(
      product?.styles
    ).map(
      ([group, options], i) =>
        selectField(
          group,
          `style${i}`,
          [
            [
              "",
              "Select (optional)"
            ],
            ...options
          ],
          (
            draft.styles.find(
              style =>
                style.startsWith(
                  `${group}: `
                )
            ) || ""
          ).slice(
            group.length + 2
          ),
          `data-wizard-style="${escapeHTML(
            group
          )}"`
        )
    ).join("")
  );
};


stepSchedule = () => {
  const draft =
    state.orderDraft;

  return frame(
    "Schedule & Assign",

    "Set dates and assign staff.",

    `
      <div class="form-grid">

        ${inputField(
          "Trial",
          "trial",
          draft.trial,
          "date",
          'required data-bind="trial"'
        )}

        ${inputField(
          "Delivery",
          "delivery",
          draft.delivery,
          "date",
          'required data-bind="delivery"'
        )}

        ${selectField(
          "Staff",
          "staff",
          [
            [
              "",
              "Select staff"
            ],

            ...state.staff.map(
              s =>
                s.name
            )
          ],
          draft.staff,
          'required data-bind="staff"'
        )}

        ${selectField(
          "Priority",
          "priority",
          masterOptions(
          "priority",
          [
            "Normal",
            "Urgent",
            "VIP"
          ]
        ),
          draft.priority,
          'data-bind="priority"'
        )}

      </div>

      ${textField(
        "Notes",
        "notes",
        draft.notes,
        'data-bind="notes"'
      )}
    `
  );
};


function paymentSummary() {
  const draft =
    state.orderDraft;

  const total =
    Number(
      draft.price ||
      0
    ) *
    Number(
      draft.qty ||
      1
    ) -
    Number(
      draft.discount ||
      0
    );

  return detailRows([
    [
      "Subtotal",
      money(
        Number(
          draft.price ||
          0
        ) *
        Number(
          draft.qty ||
          1
        )
      )
    ],

    [
      "Discount",
      money(
        Number(
          draft.discount ||
          0
        )
      )
    ],

    [
      "Total",
      money(
        total
      )
    ],

    [
      "Advance",
      money(
        Number(
          draft.advance ||
          0
        )
      )
    ],

    [
      "Balance",
      money(
        total -
        Number(
          draft.advance ||
          0
        )
      )
    ]
  ]);
}


stepPayment = () => {
  const draft =
    state.orderDraft;

  return frame(
    "Pricing & Payment",

    "Enter pricing and advance.",

    `
      <div class="form-grid">

        ${inputField(
          "Unit Price",
          "price",
          draft.price,
          "number",
          'required min="0" step="0.01" data-bind="price"'
        )}

        ${inputField(
          "Discount",
          "discount",
          draft.discount,
          "number",
          'required min="0" step="0.01" data-bind="discount"'
        )}

        ${inputField(
          "Advance",
          "advance",
          draft.advance,
          "number",
          'required min="0" step="0.01" data-bind="advance"'
        )}

        ${selectField(
          "Payment Method",
          "paymentMethod",
          masterOptions(
            "payment_method",
            [
              "UPI",
              "Cash",
              "Card",
              "Bank Transfer"
            ]
          ),
          draft.paymentMethod,
          'data-bind="paymentMethod"'
        )}

      </div>

      <div
        id="paymentSummary"
        class="summary-box"
      >
        ${paymentSummary()}
      </div>
    `
  );
};


stepReview = () => {
  const draft =
    state.orderDraft;

  return frame(
    "Review Order",

    "Confirm your order details.",

    `
      <div class="summary-box">

        ${detailRows([
          [
            "Customer",
            draft.customer?.name
          ],

          [
            "Garment",
            `${draft.garment} ×${draft.qty}`
          ],

          [
            "Trial",
            draft.trial
          ],

          [
            "Delivery",
            draft.delivery
          ],

          [
            "Staff",
            draft.staff
          ],

          [
            "Priority",
            draft.priority
          ],

          [
            "Styles",
            draft.styles.join(", ") ||
            "Standard"
          ],

          [
            "Payment Method",
            draft.paymentMethod
          ],

          [
            "Notes",
            draft.notes ||
            "—"
          ],

          ...Object.entries(
            draft.measurements
          ).map(
            ([key, value]) => [
              key,
              `${value} in`
            ]
          )
        ])}

        ${paymentSummary()}

      </div>
    `,

    "Create Order"
  );
};


stepSuccess = () => `
  <div class="success-card">

    <div class="success-icon">
      ✓
    </div>

    <h2>
      Order ${escapeHTML(
        lastOrder
      )}
      Created
    </h2>

    <p>
      Saved and added to the Cutting queue.
    </p>

    <div class="modal-actions">

      ${action(
        "Print Receipt",
        "receipt-print",
        lastOrder
      )}

      ${action(
        "WhatsApp Receipt",
        "receipt-share",
        lastOrder
      )}

      ${action(
        "View Order",
        "order-view-no",
        lastOrder
      )}

      ${action(
        "Create Another Order",
        "new-order",
        "",
        "primary"
      )}

    </div>

  </div>
`;


// ============================================================
// SAVE NEW MEASUREMENT
// ============================================================

async function saveWizardMeasurement() {
  const draft =
    state.orderDraft;

  if (
    draft.measureMode !==
    "new"
  ) {
    return draft.measurementId;
  }

  const product =
    state.products.find(
      p =>
        p.name ===
        draft.garment
    );

  if (!product) {
    throw new Error(
      "Product not found"
    );
  }

  const v =
    draft.measurements ||
    {};

  const result =
    await apiRequest(
      "/api/measurements",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            customer_id:
              draft.customer.id,

            product_id:
              product.id,

            profile:
              `Order Measurement`,

            chest:
              v.Chest ?? null,

            waist:
              v.Waist ?? null,

            shoulder:
              v.Shoulder ?? null,

            sleeve:
              v.Sleeve ?? null,

            length:
              v.Length ?? null,

            neck:
              v.Neck ?? null,

            arm_hole:
              v["Arm Hole"] ??
              null,

            seat:
              v.Seat ?? null,

            thigh:
              v.Thigh ?? null,

            knee:
              v.Knee ?? null,

            bottom:
              v.Bottom ?? null,

            outseam:
              v.Outseam ?? null,

            inseam:
              v.Inseam ?? null,

            notes:
              draft.measurementNotes ||
              ""
          })
      }
    );

  return Number(
    result.measurement?.id ||
    result.id
  );
}


// ============================================================
// CREATE ORDER IN POSTGRESQL
// ============================================================

async function createWizardOrder() {
  const draft =
    state.orderDraft;

  const product =
    state.products.find(
      p =>
        p.name ===
        draft.garment
    );

  if (!product) {
    throw new Error(
      "Product not found"
    );
  }

  const staff =
    state.staff.find(
      s =>
        s.name ===
        draft.staff
    );

  const measurementId =
    await saveWizardMeasurement();

  const patternIds =
    await getSelectedPatternIds(
      product.id,
      draft.styles
    );

  const total =
    Number(
      draft.price ||
      0
    ) *
    Number(
      draft.qty ||
      1
    ) -
    Number(
      draft.discount ||
      0
    );

  const result =
    await apiRequest(
      "/api/orders",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            customer_id:
              draft.customer.id,

            trial_date:
              draft.trial,

            delivery_date:
              draft.delivery,

            total_amount:
              total,

            advance_amount:
              Number(
                draft.advance ||
                0
              ),

            priority:
              draft.priority,

            payment_method:
              draft.paymentMethod,

            notes:
              draft.notes ||
              "",

            items: [
              {
                product_id:
                  product.id,

                quantity:
                  Number(
                    draft.qty ||
                    1
                  ),

                price:
                  Number(
                    draft.price ||
                    0
                  ),

                staff_id:
                  staff?.id ||
                  null,

                measurement_id:
                  measurementId ||
                  null,

                pattern_ids:
                  patternIds,

                notes:
                  draft.styles.join(
                    ", "
                  )
              }
            ]
          })
      }
    );

  lastOrder =
    result.order?.order_number ||
    "";

  await Promise.all([
    loadOrdersFromBackend(),
    loadMeasurementsFromBackend()
  ]);

  return result;
}


// ============================================================
// WIZARD NEXT
// ============================================================

nextWizard = async () => {
  const draft =
    state.orderDraft;

  const step =
    state.wizardStep;

  const fields = [
    ...content.querySelectorAll(
      "input,select,textarea"
    )
  ];

  for (
    const field of fields
  ) {
    if (
      !field.reportValidity()
    ) {
      return;
    }
  }

  if (
    step === 0 &&
    !draft.customer
  ) {
    return toast(
      "Select a customer."
    );
  }

  if (
    step === 1 &&
    !draft.garment
  ) {
    return toast(
      "Select a garment."
    );
  }

  if (step === 2 && draft.measureMode !== "new" && !draft.measurementId) {
    return toast("Select a previous measurement profile or take new measurements.");
  }

  if (
    step === 4 &&
    draft.trial >
      draft.delivery
  ) {
    return toast(
      "Delivery must be on or after the trial."
    );
  }

  if (
    step >= 5
  ) {
    const subtotal =
      Number(
        draft.price ||
        0
      ) *
      Number(
        draft.qty ||
        1
      );

    const total =
      subtotal -
      Number(
        draft.discount ||
        0
      );

    if (
      Number(
        draft.discount ||
        0
      ) >
      subtotal
    ) {
      return toast(
        "Discount cannot exceed subtotal."
      );
    }

    if (
      Number(
        draft.advance ||
        0
      ) >
      total
    ) {
      return toast(
        "Advance cannot exceed total."
      );
    }
  }

  if (
    step === 6
  ) {
    try {
      await createWizardOrder();

      state.wizardStep =
        7;

      renderWizard();

      return;

    } catch (error) {
      console.error(
        error
      );

      toast(
        error.message ||
        "Could not create order."
      );

      return;
    }
  }

  if (step === 1) {
    try {
      if (!await loadWizardMeasurementProfiles(draft)) return;
      if (state.orderDraft !== draft || state.wizardStep !== step) return;
    } catch (error) {
      return toast(error.message || "Could not load previous measurements. Please try again.");
    }
  }

  state.wizardStep++;

  renderWizard();
};


// ============================================================
// FORM ERROR
// ============================================================

function formError(
  form,
  message
) {
  const error =
    form.querySelector(
      ".form-error"
    );

  if (error) {
    error.textContent =
      message;
  }
}


// ============================================================
// FORMS
// ============================================================

document.addEventListener(
  "submit",

  async event => {
    const form =
      event.target;

    if (
      !form.dataset.form
    ) {
      return;
    }

    event.preventDefault();

    if (
      !form.reportValidity()
    ) {
      return;
    }

    if (
      form.dataset.form ===
      "wizard"
    ) {
      return nextWizard();
    }

    const data =
      Object.fromEntries(
        new FormData(form)
      );

    const id =
      form.dataset.id;

    const kind =
      form.dataset.form;

    for (
      const key in data
    ) {
      if (
        typeof data[key] ===
        "string"
      ) {
        data[key] =
          data[key].trim();
      }
    }


    // ========================================================
    // CUSTOMER
    // ========================================================

    if (
      kind ===
      "customer"
    ) {
      if (
        !data.name ||
        !/^\d{10}$/.test(
          data.phone
        )
      ) {
        return formError(
          form,
          "Enter a name and a 10-digit mobile number."
        );
      }

      try {
  const url =
    id
      ? `/api/customers/${id}`
      : "/api/customers";

  const result =
    await apiRequest(
      url,
      {
        method:
          id
            ? "PUT"
            : "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            name:
              data.name,

            mobile:
              data.phone,

            alternate_mobile:
              data.alternate ||
              "",

            address:
              data.address ||
              "",

            city:
              data.city ||
              ""
          })
      }
    );


  const savedCustomer =
    mapCustomer(
      result.customer ||
      result
    );


  await loadCustomersFromBackend();


  // If new customer was added from New Order wizard
  if (
    !id &&
    state.view ===
      "wizard" &&
    state.wizardStep ===
      0
  ) {

    state.orderDraft.customer =
      state.customers.find(
        c =>
          Number(c.id) ===
          Number(
            savedCustomer.id
          )
      ) ||
      savedCustomer;


    state.orderDraft.measurements =
      {};

    state.orderDraft.measurementId =
      null;

    state.orderDraft.measureMode =
      "new";


    closeDialog();


    // Move automatically to Choose Garment
    state.wizardStep =
      1;


    renderWizard();


    toast(
      "Customer added and selected."
    );


    return;
  }


  // Normal customer add/edit outside New Order
  closeDialog();

  render();

  toast(
    id
      ? "Customer updated successfully."
      : "Customer added successfully."
  );

  return;

} catch (error) {

  return formError(
    form,
    error.message
  );
}
    }


    // ========================================================
    // PRODUCT
    // ========================================================

    if (
      kind ===
      "product"
    ) {
      if (
        !data.name
      ) {
        return formError(
          form,
          "Enter a product name."
        );
      }

      const lines =
        data.styles
          .split("\n")
          .filter(
            line =>
              line.trim()
          );

      const groups =
        styleGroups(
          data.styles
        );

      if (
        !lines.length ||
        lines.some(
          line =>
            line.split(":")
              .length !== 2
        ) ||
        groups.some(
          group =>
            !group[0] ||
            !group[1].length
        ) ||
        new Set(
          groups.map(
            group =>
              group[0]
          )
        ).size !==
        groups.length
      ) {
        return formError(
          form,
          "Use unique groups: Fit: Regular, Slim (one group per line)."
        );
      }

      try {
        const url =
          id
            ? `/api/products/${id}`
            : "/api/products";

        const result =
          await apiRequest(
            url,
            {
              method:
                id
                  ? "PUT"
                  : "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  name:
                    data.name,

                  type:
                    data.type,

                  price:
                    Number(
                      data.price ||
                      0
                    ),

                  styles:
                    data.styles
                })
            }
          );

        const product =
          result.product ||
          result;

        await syncProductStyles(
          product.id ||
          id,
          data.styles
        );

        await loadProductsFromBackend();

        closeDialog();

        render();

        toast(
          id
            ? "Product updated successfully."
            : "Product added successfully."
        );

        return;

      } catch (error) {
        return formError(
          form,
          error.message
        );
      }
    }


    // ========================================================
    // STAFF
    // ========================================================

    if (
      kind ===
      "staff"
    ) {
      if (
        !data.name ||
        !/^\d{10}$/.test(
          data.phone
        )
      ) {
        return formError(
          form,
          "Enter a name and 10-digit mobile number."
        );
      }

      try {
        await apiRequest(
          id
            ? `/api/staff/${id}`
            : "/api/staff",
          {
            method:
              id
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                name:
                  data.name,

                mobile:
                  data.phone,

                role:
                  data.role
              })
          }
        );

        await loadStaffFromBackend();

        await loadOrdersFromBackend();

        closeDialog();

        render();

        toast(
          id
            ? "Staff updated successfully."
            : "Staff added successfully."
        );

        return;

      } catch (error) {
        return formError(
          form,
          error.message
        );
      }
    }


    // ========================================================
    // MEASUREMENT
    // ========================================================

    if (
      kind ===
      "measurement"
    ) {
      if (
        !data.profile
      ) {
        return formError(
          form,
          "Enter a profile name."
        );
      }

      const product =
        state.products.find(
          p =>
            p.name ===
            data.garment
        );

      if (!product) {
        return formError(
          form,
          "Product not found."
        );
      }

      const values = {};

      for (
        const name of
        measurementNames(
          data.garment
        )
      ) {
        values[name] =
          Number(
            data[
              `measure_${name}`
            ] ||
            0
          );
      }

      try {
        await apiRequest(
          id
            ? `/api/measurements/${id}`
            : "/api/measurements",
          {
            method:
              id
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                customer_id:
                  Number(
                    data.customerId
                  ),

                product_id:
                  product.id,

                profile:
                  data.profile,

                chest:
                  values.Chest ??
                  null,

                waist:
                  values.Waist ??
                  null,

                shoulder:
                  values.Shoulder ??
                  null,

                sleeve:
                  values.Sleeve ??
                  null,

                length:
                  values.Length ??
                  null,

                neck:
                  values.Neck ??
                  null,

                arm_hole:
                  values["Arm Hole"] ??
                  null,

                seat:
                  values.Seat ??
                  null,

                thigh:
                  values.Thigh ??
                  null,

                knee:
                  values.Knee ??
                  null,

                bottom:
                  values.Bottom ??
                  null,

                outseam:
                  values.Outseam ??
                  null,

                inseam:
                  values.Inseam ??
                  null,

                notes:
                  data.notes ||
                  ""
              })
          }
        );

        await loadMeasurementsFromBackend();

        closeDialog();

        render();

        toast(
          id
            ? "Measurements updated successfully."
            : "Measurements saved successfully."
        );

        return;

      } catch (error) {
        return formError(
          form,
          error.message
        );
      }
    }


    // ========================================================
    // ORDER EDIT
    // ========================================================

    if (
      kind ===
      "order"
    ) {
      if (
        Number(
          data.advance
        ) >
        Number(
          data.total
        )
      ) {
        return formError(
          form,
          "Advance cannot exceed total."
        );
      }

      if (
        data.trial &&
        data.trial >
        data.deliveryDate
      ) {
        return formError(
          form,
          "Delivery must be on or after trial."
        );
      }

      const oldOrder =
        state.orders.find(
          o =>
            Number(o.id) ===
            Number(id)
        );

      try {
        await apiRequest(
          `/api/orders/${id}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                trial_date:
                  data.trial ||
                  null,

                delivery_date:
                  data.deliveryDate,

                total_amount:
                  Number(
                    data.total
                  ),

                advance_amount:
                  Number(
                    data.advance
                  ),

                status:
                  data.status,

                staff:
                  data.staff,

                priority:
                  oldOrder?.priority ||
                  "Normal",

                payment_method:
                  oldOrder?.paymentMethod ||
                  "Cash",

                notes:
                  data.notes ||
                  ""
              })
          }
        );

        await loadOrdersFromBackend();

        closeDialog();

        render();

        toast(
          "Order updated successfully."
        );

        return;

      } catch (error) {
        return formError(
          form,
          error.message
        );
      }
    }


    // ========================================================
// MASTER CONFIG
// ========================================================

if (
  kind ===
  "master-config"
) {
  if (
    !data.config_type ||
    !data.config_key ||
    !data.config_value
  ) {
    return formError(
      form,
      "Fill all required fields."
    );
  }

  try {
    await apiRequest(
      id
        ? `/api/master-config/${id}`
        : "/api/master-config",
      {
        method:
          id
            ? "PUT"
            : "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            config_type:
              data.config_type,

            config_key:
              data.config_key
                .toLowerCase()
                .replace(
                  /\s+/g,
                  "_"
                ),

            config_value:
              data.config_value,

            display_order:
              Number(
                data.display_order ||
                0
              ),

            active: true
          })
      }
    );

    await loadMasterConfigFromBackend();

    closeDialog();

    render();

    toast(
      id
        ? "Master config updated."
        : "Master config added."
    );

    return;

  } catch (error) {
    return formError(
      form,
      error.message
    );
  }
}

    // ========================================================
    // SETTINGS
    // ========================================================

    if (
      kind ===
      "settings"
    ) {
      if (
        !data.name
      ) {
        return formError(
          form,
          "Enter a store name."
        );
      }

      try {
        await apiRequest(
          "/api/settings",
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                store_name:
                  data.name,

                phone:
                  data.phone,

                order_prefix:
                  data.prefix.toUpperCase(),

                default_delivery_days:
                  Number(
                    data.days
                  ),

                address:
                  data.address
              })
          }
        );

        await loadSettingsFromBackend();

        render();

        toast(
          "Settings saved successfully."
        );

        return;

      } catch (error) {
        return formError(
          form,
          error.message
        );
      }
    }
  }
);


// ============================================================
// SEARCH / FILTER
// ============================================================

function filterRecords() {
  const query =
    (
      content.querySelector(
        "[data-search]"
      )?.value ||
      ""
    ).toLowerCase();

  const status =
    content.querySelector(
      '[data-filter="status"]'
    )?.value;

  const staff =
    content.querySelector(
      '[data-filter="staff"]'
    )?.value;

  content
    .querySelectorAll(
      "[data-record]"
    )
    .forEach(
      record => {
        const text =
          (
            record.textContent +
            " " +
            (
              record.dataset.phone ||
              ""
            )
          ).toLowerCase();

        const matchesSearch =
          text.includes(
            query
          );

        const matchesStatus =
          !status ||
          status ===
            "All Status" ||
          record.dataset.status ===
            status;

        const matchesStaff =
          !staff ||
          staff ===
            "All Staff" ||
          String(
            record.dataset.staff ||
            ""
          )
            .split(",")
            .map(
              value =>
                value.trim()
            )
            .includes(
              staff
            );

        record.hidden =
          !(
            matchesSearch &&
            matchesStatus &&
            matchesStaff
          );
      }
    );
}


// ============================================================
// INPUT EVENTS
// ============================================================

document.addEventListener(
  "input",

  event => {
    const el =
      event.target;

    if (
      el.hasAttribute(
        "data-search"
      )
    ) {
      filterRecords();
    }

    if (
      el.dataset.measure
    ) {
      state.orderDraft.measurements[
        el.dataset.measure
      ] =
        Number(
          el.value
        );
    }

    if (
      el.dataset.bind &&
      el.type ===
      "number"
    ) {
      state.orderDraft[
        el.dataset.bind
      ] =
        Number(
          el.value
        );
    }

    if (
      $("#paymentSummary")
    ) {
      $("#paymentSummary").innerHTML =
        paymentSummary();
    }
  }
);


// ============================================================
// CHANGE EVENTS
// ============================================================

document.addEventListener(
  "change",

  event => {
    const el =
      event.target;

    const draft =
      state.orderDraft;

    if (
      el.dataset.filter
    ) {
      filterRecords();
    }

    if (
      el.dataset.bind
    ) {
      draft[
        el.dataset.bind
      ] =
        el.type ===
        "number"
          ? Number(
              el.value
            )
          : el.value;
    }

    if (
      el.hasAttribute(
        "data-wizard-customer"
      )
    ) {
      draft.customer =
        state.customers.find(
          c =>
            Number(c.id) ===
            Number(
              el.value
            )
        ) ||
        null;

      draft.measurements =
        {};

      draft.measurementId =
        null;

      draft.measureMode =
        "new";
    }

    if (
      el.hasAttribute(
        "data-wizard-garment"
      )
    ) {
      draft.garment =
        el.value;

      const product =
        state.products.find(
          p =>
            p.name ===
            el.value
        );

      draft.price =
        product?.price ||
        0;

      draft.productId =
        product?.id ||
        null;

      draft.styles =
        [];

      draft.measurements =
        {};

      draft.measurementId =
        null;

      draft.measureMode =
        "new";
    }

    if (
      el.hasAttribute(
        "data-wizard-profile"
      )
    ) {
      draft.measureMode =
        el.value;

      const measurement =
        state.measurements.find(
          m =>
            `profile:${m.id}` ===
            el.value
        );

      draft.measurements =
        measurement
          ? {
              ...measurement.values
            }
          : {};

      draft.measurementNotes =
        measurement?.notes ||
        "";

      draft.measurementId =
        measurement?.id ||
        null;

      renderWizard();
    }

    if (
      el.dataset.wizardStyle
    ) {
      const group =
        el.dataset.wizardStyle;

      draft.styles =
        draft.styles.filter(
          style =>
            !style.startsWith(
              `${group}: `
            )
        );

      if (
        el.value
      ) {
        draft.styles.push(
          `${group}: ${el.value}`
        );
      }
    }

    if (
      el.hasAttribute(
        "data-measure-garment"
      )
    ) {
      $("#measureFields").innerHTML =
        measurementFields(
          el.value
        );
    }

    if (
      $("#paymentSummary")
    ) {
      $("#paymentSummary").innerHTML =
        paymentSummary();
    }
  }
);


// ============================================================
// RECEIPT
// ============================================================

function receiptText(o) {
  return `${state.settings.name}
Order: ${o.no}
Customer: ${o.customer}
Items: ${o.items}
Delivery: ${o.deliveryDate || o.delivery}
Total: ${money(o.total)}
Advance: ${money(o.advance)}
Balance: ${money(o.total - o.advance)}
${state.settings.phone}`;
}


function printOrder(id) {
  let o =
    state.orders.find(
      order =>
        Number(order.id) ===
        Number(id)
    );

  if (!o) {
    o =
      state.orders.find(
        order =>
          order.no === id
      );
  }

  if (!o) {
    return;
  }

  document
    .getElementById(
      "printReceipt"
    )
    ?.remove();

  const el =
    document.createElement(
      "section"
    );

  el.id =
    "printReceipt";

  el.textContent =
    receiptText(o);

  document.body.appendChild(
    el
  );

  window.print();
}


// ============================================================
// STAGE ADVANCE
// ============================================================

async function advanceOrderStage(
  order
) {
  await getCompleteOrder(
    order
  );

  const data =
    state.orderDetails[
      order.id
    ];

  if (
    !data ||
    !data.items?.length
  ) {
    throw new Error(
      "No order item found."
    );
  }

  const current =
    order.status ===
    "Overdue"
      ? "Cutting"
      : order.status;

  const index =
    stages.indexOf(
      current
    );

  const next =
    stages[
      Math.min(
        stages.length - 1,
        Math.max(
          0,
          index
        ) + 1
      )
    ];

  if (
    current ===
    "Delivered"
  ) {
    return;
  }

  for (
    const item of
    data.items
  ) {
    await apiRequest(
      "/api/production",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            order_item_id:
              item.id,

            status:
              next,

            staff_id:
              item.staff_id ||
              null,

            notes:
              `Moved to ${next}`
          })
      }
    );
  }

  delete state.orderDetails[
    order.id
  ];

  await loadOrdersFromBackend();

  render();

  toast(
    `${order.no} moved to ${next}`
  );
}


// ============================================================
// CLICK EVENTS
// ============================================================

document.addEventListener(
  "click",

  async event => {
    if (
      event.target.classList.contains(
        "modal-backdrop"
      )
    ) {
      return closeDialog();
    }

    if (
      event.target.closest(
        "[data-view]"
      )
    ) {
      closeDialog();
    }

    const button =
      event.target.closest(
        "[data-action]"
      );

    if (!button) {
      return;
    }

    const id =
      button.dataset.id;

    switch (
      button.dataset.action
    ) {

      case "master-config-add":
        return masterConfigDialog();


      case "master-config-edit":
        return masterConfigDialog(id);


      case "master-config-toggle": {
        let item = null;

        for (
          const type in state.masterConfig
        ) {
          item =
            state.masterConfig[type].find(
              row =>
                Number(row.id) ===
                Number(id)
            );

          if (item) {
            break;
          }
        }

        if (!item) {
          return;
        }

        try {
          await apiRequest(
            `/api/master-config/${id}/status`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  active:
                    !item.active
                })
            }
          );

          await loadMasterConfigFromBackend();

          render();

          toast(
            item.active
              ? "Config disabled."
              : "Config enabled."
          );

        } catch (error) {
          toast(
            error.message ||
            "Could not update config."
          );
        }

        return;
      }
      case "wizard-measurement-source": {
        const draft = state.orderDraft;
        if (draft.measureMode === id || (id === "previous" && draft.measureMode !== "new")) return;
        const measurement = (draft.measurementProfiles || []).find(m => `profile:${m.id}` === id);
        if (id !== "new" && id !== "previous" && !measurement) return;
        draft.measureMode = id;
        draft.measurementId = measurement?.id || null;
        draft.measurements = measurement ? { ...measurement.values } : {};
        draft.measurementNotes = measurement?.notes || "";
        return renderWizard();
      }

        case "wizard-select-customer": {

  const customer =
    state.customers.find(
      c =>
        Number(c.id) ===
        Number(id)
    );

  if (!customer) {
    return;
  }

  state.orderDraft.customer =
    Number(state.orderDraft.customer?.id) === Number(customer.id)
      ? null
      : customer;

  state.orderDraft.measurements =
    {};

  state.orderDraft.measurementId =
    null;

  state.orderDraft.measureMode =
    "new";

  renderWizard();

  return;
}
      case "close-dialog":
        return closeDialog();


      case "customer-edit":
        return customerDialog(
          id
        );


      case "customer-view": {
        const c =
          state.customers.find(
            customer =>
              Number(
                customer.id
              ) ===
              Number(id)
          );

        if (!c) {
          return;
        }

        return dialog(
          c.name,

          detailRows([
            [
              "Mobile",
              c.phone
            ],

            [
              "City",
              c.city
            ],

            [
              "Alternate",
              c.alternate ||
              "—"
            ],

            [
              "Address",
              c.address ||
              "—"
            ]
          ])

          +

          rowsTable(
            [
              "Order",
              "Customer",
              "Items",
              "Status",
              "Staff",
              "Delivery",
              "Amount",
              "Actions"
            ],

            state.orders
              .filter(
                o =>
                  Number(
                    o.customerId
                  ) ===
                  Number(c.id)
              )
              .map(
                o =>
                  orderRow(o)
              )
          )
        );
      }


      case "customer-order":
        openWizard();

        state.orderDraft.customer =
          state.customers.find(
            c =>
              Number(c.id) ===
              Number(id)
          );

        return renderWizard();


      case "product-add":
        return productDialog();


      case "product-edit":
        return productDialog(
          id
        );


      case "staff-add":
        return staffDialog();


      case "staff-edit":
        return staffDialog(
          id
        );


      case "staff-queue": {
        const member =
          state.staff.find(
            s =>
              Number(s.id) ===
              Number(id)
          );

        setView(
          "production"
        );

        const select =
          content.querySelector(
            '[data-filter="staff"]'
          );

        if (
          select &&
          member
        ) {
          select.value =
            member.name;

          filterRecords();
        }

        return;
      }


      case "measurement-add":
        return measurementDialog();


      case "measurement-edit":
        return measurementDialog(
          id
        );


      case "measurement-view": {
        const m =
          state.measurements.find(
            measurement =>
              Number(
                measurement.id
              ) ===
              Number(id)
          );

        if (!m) {
          return;
        }

        return dialog(
          m.profile,

          detailRows([
            [
              "Garment",
              m.garment
            ],

            ...Object.entries(
              m.values
            ).map(
              ([key, value]) => [
                key,
                `${value} in`
              ]
            ),

            [
              "Notes",
              m.notes ||
              "—"
            ]
          ])
        );
      }


      case "order-view":
        return orderDetail(
          id
        );


      case "order-view-no": {
        const order =
          state.orders.find(
            o =>
              o.no ===
              id
          );

        if (
          order
        ) {
          return orderDetail(
            order.id
          );
        }

        return;
      }


      case "order-edit":
        return orderDialog(
          id
        );


      case "order-duplicate": {
        const o =
          state.orders.find(
            order =>
              Number(
                order.id
              ) ===
              Number(id)
          );

        if (!o) {
          return;
        }

        await getCompleteOrder(
          o
        );

        openWizard();

        Object.assign(
          state.orderDraft,
          {
            customer:
              state.customers.find(
                c =>
                  Number(c.id) ===
                  Number(
                    o.customerId
                  )
              ) ||
              null,

            garment:
              o.garment ||
              o.items.split(
                " ×"
              )[0],

            qty:
              o.qty ||
              1,

            price:
              o.price ||
              0,

            styles: [
              ...(o.styles || [])
            ],

            measurements: {
              ...(o.measurements || {})
            },

            measurementNotes:
              o.measurementNotes ||
              "",

            measureMode:
              "new",

            measurementId:
              null,

            notes:
              o.notes ||
              "",

            priority:
              o.priority ||
              "Normal",

            paymentMethod:
              o.paymentMethod ||
              "Cash",

            staff:
              o.staff ||
              ""
          }
        );

        return renderWizard();
      }


      case "stage-advance": {
        const o =
          state.orders.find(
            order =>
              Number(
                order.id
              ) ===
              Number(id)
          );

        if (!o) {
          return;
        }

        try {
          await advanceOrderStage(
            o
          );

        } catch (error) {
          toast(
            error.message ||
            "Could not move order."
          );
        }

        return;
      }


      case "receipt-print":
        return printOrder(
          id
        );


      case "receipt-share": {
        let o =
          state.orders.find(
            order =>
              Number(
                order.id
              ) ===
              Number(id)
          );

        if (!o) {
          o =
            state.orders.find(
              order =>
                order.no ===
                id
            );
        }

        if (!o) {
          return;
        }

        const c =
          state.customers.find(
            customer =>
              Number(
                customer.id
              ) ===
              Number(
                o.customerId
              )
          );

        if (
          !c?.phone
        ) {
          return toast(
            "Add a customer mobile number before sharing."
          );
        }

        return dialog(
          "WhatsApp Receipt",

          `
            <pre class="receipt-preview">${escapeHTML(
              receiptText(o)
            )}</pre>

            <p>
              Review the receipt, then open WhatsApp to send it.
            </p>

            <a
              class="primary receipt-link"
              target="_blank"
              rel="noopener noreferrer"
              href="https://wa.me/91${encodeURIComponent(
                c.phone
              )}?text=${encodeURIComponent(
                receiptText(o)
              )}"
            >
              Open WhatsApp
            </a>
          `
        );
      }


      case "notifications": {
        const list =
          state.orders.filter(
            o =>
              o.status !==
                "Delivered" &&
              o.deliveryDate <=
                todayISO()
          );

        return dialog(
          "Orders needing attention",

          list.length
            ? rowsTable(
                [
                  "Order",
                  "Customer",
                  "Items",
                  "Status",
                  "Staff",
                  "Delivery",
                  "Amount",
                  "Actions"
                ],

                list.map(
                  o =>
                    orderRow(o)
                )
              )
            : `
                <p>
                  No orders are due or overdue.
                </p>
              `
        );
      }


      case "export-report":
        return exportOrders();
    }
  }
);


// ============================================================
// KEYBOARD ACCESS
// ============================================================

document.addEventListener(
  "keydown",

  event => {
    const modal =
      $("#modalRoot .modal-dialog");

    if (!modal) {
      return;
    }

    if (
      event.key ===
      "Escape"
    ) {
      event.preventDefault();

      closeDialog();
    }

    if (
      event.key ===
      "Tab"
    ) {
      const elements = [
        ...modal.querySelectorAll(
          "button,input,select,textarea,a[href]"
        )
      ];

      const first =
        elements[0];

      const last =
        elements[
          elements.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement ===
          first
      ) {
        event.preventDefault();

        last.focus();

      } else if (
        !event.shiftKey &&
        document.activeElement ===
          last
      ) {
        event.preventDefault();

        first.focus();
      }
    }
  }
);


// ============================================================
// REPORTS - SAME UI, REAL DB DATA
// ============================================================

reports = () => {
  const total =
    state.orders.reduce(
      (sum, order) =>
        sum +
        Number(
          order.total ||
          0
        ),
      0
    );

  const advance =
    state.orders.reduce(
      (sum, order) =>
        sum +
        Number(
          order.advance ||
          0
        ),
      0
    );

  return `
    <div class="grid report-stats">

      ${
        [
          [
            "Orders",
            state.orders.length
          ],

          [
            "Order Value",
            money(total)
          ],

          [
            "Received",
            money(advance)
          ],

          [
            "Balance",
            money(
              total -
              advance
            )
          ]
        ].map(
          item => `
            <div class="stat">

              <div class="label">
                ${item[0]}
              </div>

              <div class="value">
                ${item[1]}
              </div>

            </div>
          `
        ).join("")
      }

    </div>

    <div
      class="panel"
      style="margin-top:18px"
    >

      <div class="panel-head">

        <div class="panel-title">
          Production Summary
        </div>

        ${action(
          "Download CSV",
          "export-report"
        )}

      </div>

      <div class="panel-body">

        ${detailRows(
          [
            ...stages,
            "Overdue"
          ].map(
            stage => [
              stage,

              state.orders.filter(
                order =>
                  order.status ===
                  stage
              ).length
            ]
          )
        )}

      </div>

    </div>
  `;
};


function exportOrders() {
  const rows = [
    [
      "Order",
      "Customer",
      "Items",
      "Status",
      "Staff",
      "Delivery",
      "Total",
      "Advance",
      "Balance"
    ],

    ...state.orders.map(
      o => [
        o.no,
        o.customer,
        o.items,
        o.status,
        o.staff,
        o.deliveryDate,
        o.total,
        o.advance,
        o.total -
        o.advance
      ]
    )
  ];

  const csv =
    rows.map(
      row =>
        row.map(
          value =>
            '"' +
            String(
              value ??
              ""
            )
              .replace(
                /^[=+@-]/,
                "'$&"
              )
              .replace(
                /"/g,
                '""'
              ) +
            '"'
        ).join(",")
    ).join("\r\n");

  const url =
    URL.createObjectURL(
      new Blob(
        [
          "\uFEFF" +
          csv
        ],
        {
          type:
            "text/csv;charset=utf-8"
        }
      )
    );

  const a =
    document.createElement(
      "a"
    );

  a.href =
    url;

  a.download =
    `tailor-orders-${todayISO()}.csv`;

  a.click();

  setTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    1000
  );
}


// ============================================================
// DASHBOARD - SAME UI, REAL DB DATA
// ============================================================

dashboard = () => {
  const active =
    state.orders.filter(
      o =>
        o.status !==
        "Delivered"
    );

  const due =
    active.filter(
      o =>
        o.deliveryDate &&
        o.deliveryDate <=
        todayISO()
    );

  return `
    <div class="grid stats">

      ${
        [
          [
            "Orders",
            state.orders.length
          ],

          [
            "Trials",
            active.filter(
              o =>
                o.status ===
                "Trial"
            ).length
          ],

          [
            "Ready",
            active.filter(
              o =>
                o.status ===
                "Ready"
            ).length
          ],

          [
            "Pending",
            active.length
          ],

          [
            "Due / Overdue",
            due.length
          ],

          [
            "Balance Due",
            money(
              state.orders.reduce(
                (sum, order) =>
                  sum +
                  Number(
                    order.total ||
                    0
                  ) -
                  Number(
                    order.advance ||
                    0
                  ),
                0
              )
            )
          ]
        ].map(
          item => `
            <div class="stat">

              <div class="label">
                ${item[0]}
              </div>

              <div class="value">
                ${item[1]}
              </div>

            </div>
          `
        ).join("")
      }

    </div>

    <div class="grid dashboard-main">

      <div class="panel">

        <div class="panel-head">

          <div class="panel-title">
            Recent Orders
          </div>

          <button
            class="ghost"
            data-view="orders"
          >
            View all →
          </button>

        </div>

        ${rowsTable(
          [
            "Order",
            "Customer",
            "Items",
            "Status",
            "Staff",
            "Delivery",
            "Amount",
            "Actions"
          ],

          state.orders
            .slice(
              0,
              6
            )
            .map(
              o =>
                orderRow(o)
            )
        )}

      </div>

      <div class="grid">

        <div class="panel">

          <div class="panel-head">

            <div class="panel-title">
              Due / Overdue
            </div>

          </div>

          <div class="panel-body due-list">

            ${
              due.map(
                o => `
                  <div class="due-item">

                    <div>

                      <strong>
                        ${escapeHTML(
                          o.no
                        )}
                        ·
                        ${escapeHTML(
                          o.customer
                        )}
                      </strong>

                      <div class="meta">
                        ${escapeHTML(
                          o.deliveryDate
                        )}
                        ·
                        ${escapeHTML(
                          o.status
                        )}
                      </div>

                    </div>

                    ${action(
                      "View",
                      "order-view",
                      o.id,
                      "ghost"
                    )}

                  </div>
                `
              ).join("")

              ||

              `
                <p class="muted">
                  No orders are due.
                </p>
              `
            }

          </div>

        </div>

        <div class="panel panel-body quick-actions">

          ${action(
            "+ New Order",
            "new-order",
            "",
            "primary"
          )}

          ${action(
            "+ Add Customer",
            "add-customer"
          )}

          <button
            class="outline"
            data-view="production"
          >
            Production Board
          </button>

          ${action(
            "+ Measurements",
            "measurement-add"
          )}

        </div>

      </div>

    </div>
  `;
};


// ============================================================
// FOLLOW UPS - SAME UI
// ============================================================

function followUpDate(
  offset = 0,
  base = todayISO()
) {
  const date =
    new Date(
      `${base}T12:00:00`
    );

  date.setDate(
    date.getDate() +
    offset
  );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}


function followUpsFor(
  date
) {
  return state.orders
    .filter(
      o =>
        o.status !==
        "Delivered"
    )
    .flatMap(
      o => {
        const events = [];

        if (
          o.trial ===
            date &&
          ![
            "Ready",
            "Delivered"
          ].includes(
            o.status
          )
        ) {
          events.push({
            order: o,
            type: "Trial"
          });
        }

        if (
          o.deliveryDate ===
          date
        ) {
          events.push({
            order: o,
            type: "Delivery"
          });
        }

        return events;
      }
    );
}


function followUpPanel(
  label,
  date
) {
  const events =
    followUpsFor(
      date
    );

  const displayDate =
    new Date(
      `${date}T12:00:00`
    ).toLocaleDateString(
      "en-IN",
      {
        weekday:
          "short",

        day:
          "numeric",

        month:
          "short"
      }
    );

  return `
    <section class="panel follow-up-panel">

      <div class="panel-head">

        <div>

          <div class="panel-title">
            ${label} Follow-ups
          </div>

          <div class="panel-sub">
            ${escapeHTML(
              displayDate
            )}
            · Trials and deliveries
          </div>

        </div>

        <span
          class="follow-up-count"
          aria-label="${events.length} follow-ups"
        >
          ${events.length}
        </span>

      </div>

      <div class="panel-body follow-up-list">

        ${
          events.map(
            ({
              order: o,
              type
            }) => {
              const customer =
                state.customers.find(
                  c =>
                    Number(
                      c.id
                    ) ===
                    Number(
                      o.customerId
                    )
                );

              return `
                <article class="follow-up-item">

                  <div class="follow-up-details">

                    <span
                      class="status ${
                        type ===
                        "Trial"
                          ? "trial"
                          : "ready"
                      }"
                    >
                      ${type}
                    </span>

                    <strong>
                      ${escapeHTML(
                        o.customer
                      )}
                    </strong>

                    <div class="small muted">
                      ${escapeHTML(
                        o.no
                      )}
                      ·
                      ${escapeHTML(
                        o.items
                      )}
                      ·
                      ${escapeHTML(
                        o.staff
                      )}
                    </div>

                    ${
                      customer?.phone
                        ? `
                          <a
                            class="follow-up-phone"
                            href="tel:${escapeHTML(
                              customer.phone.replace(
                                /[^0-9+]/g,
                                ""
                              )
                            )}"
                          >
                            ${escapeHTML(
                              customer.phone
                            )}
                          </a>
                        `
                        : `
                          <span class="small muted">
                            No mobile number saved
                          </span>
                        `
                    }

                    ${
                      type ===
                      "Delivery"
                        ? `
                          <div class="small muted">
                            Balance:
                            ${money(
                              Math.max(
                                0,
                                o.total -
                                o.advance
                              )
                            )}
                          </div>
                        `
                        : ""
                    }

                  </div>

                  <div class="follow-up-actions">

                    ${action(
                      "View Order",
                      "order-view",
                      o.id
                    )}

                    ${action(
                      "Reschedule",
                      "order-edit",
                      o.id,
                      "ghost"
                    )}

                  </div>

                </article>
              `;
            }
          ).join("")

          ||

          `
            <div class="follow-up-empty">
              No follow-ups scheduled for ${label.toLowerCase()}.
            </div>
          `
        }

      </div>

    </section>
  `;
}


const dashboardWithoutFollowUps =
  dashboard;


dashboard = () => `
  <div class="grid follow-up-grid">

    ${followUpPanel(
      "Today's",
      followUpDate()
    )}

    ${followUpPanel(
      "Tomorrow's",
      followUpDate(1)
    )}

  </div>

  ${dashboardWithoutFollowUps()}
`;


// ============================================================
// INITIAL LOAD
// ============================================================

async function initialiseApp() {
  try {
    await Promise.all([
      loadCustomersFromBackend(),
      loadProductsFromBackend(),
      loadStaffFromBackend(),
      loadSettingsFromBackend(),
      loadPatternsFromBackend(),
      loadMasterConfigFromBackend(),
    ]);

    await Promise.all([
      loadMeasurementsFromBackend(),
      loadOrdersFromBackend(),
      loadPaymentsFromBackend()
    ]);

    const badge =
      $("#ordersBadge");

    if (badge) {
      badge.textContent =
        state.orders.length;
    }

    render();

  } catch (error) {
    console.error(
      "Initial load error:",
      error
    );

    toast(
      "Some data could not be loaded."
    );

    render();
  }
}


// ============================================================
// START APPLICATION
// ============================================================

render();

initialiseApp();
