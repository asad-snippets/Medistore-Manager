import express from "express";
import connectToDb from "./Database/db.js";
import Medicine from "./database/medistore.js";
import Customer from "./Database/customer.js"; // import Customer model here
import authRoutes from "./routes/auth.js";
import session from 'express-session';
import { requireAuth } from './middleware/authMiddleware.js';
import { getSignup, postSignup, getLogin, postLogin, logout } from './controllers/authController.js';
import ExcelJS from 'exceljs';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.successMessage = req.session.successMessage || null;
  res.locals.error = req.session.error || null;
  req.session.successMessage = null;
  req.session.error = null;
  next();
});

connectToDb();

app.use('/auth', authRoutes);

app.get('/', requireAuth, async (req, res) => {
  const user = req.session.user;
  const medicines = await Medicine.find({});
  const totalMedicines = medicines.length;
  const lowStockCount = medicines.filter(m => m.stock < 10).length;
  const totalCategories = new Set(medicines.map(m => m.category)).size;

  res.render('index', {
    user,
    totalMedicines,
    lowStockCount,
    totalCategories
  });
});

app.get('/records', requireAuth, async (req, res) => {
  const medicines = await Medicine.find({});
  res.render('show', { medicines });
});

app.get('/add', requireAuth, (req, res) => {
  res.render('addMedicine');
});

app.post('/add', requireAuth, async (req, res) => {
  const { name, category, price, stock } = req.body;
  const newMedicine = new Medicine({ name, category, price, stock });
  // Check if medicine with same name and category exists
  const existingMedicine = await Medicine.findOne({ name, category });
  if (existingMedicine) {
    // Update stock and price
    existingMedicine.stock += parseInt(stock, 10);
    existingMedicine.price = price;
    await existingMedicine.save();
  } else {
    await newMedicine.save();
  }
  req.session.successMessage = 'Medicine added successfully!';
  res.redirect('/add');
});

app.get('/edit', requireAuth, async (req, res) => {
  const medicine = await Medicine.findById(req.query.id);
  res.render('update', { medicine });
});

app.post('/update', requireAuth, async (req, res) => {
  await Medicine.findByIdAndUpdate(req.body.id, req.body);
  req.session.successMessage = 'Medicine updated successfully!';
  res.redirect(`/edit?id=${req.body.id}`);
});

app.get('/delete-confirm', requireAuth, async (req, res) => {
  const medicine = await Medicine.findById(req.query.id);
  req.session.successMessage = 'Medicine Deleted successfully!';
  res.render('delete', { medicine });
});

app.post('/delete', requireAuth, async (req, res) => {
  await Medicine.findByIdAndDelete(req.body.id);
  res.redirect('/records');
});


app.get('/customers', requireAuth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    const successMessage = req.session.successMessage;
    const error = req.session.error;
    req.session.successMessage = null;
    req.session.error = null;
    res.render('Customers/showcustomers', { customers, successMessage, error });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/customers/export', requireAuth, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sold Medicines');

    worksheet.columns = [
      { header: 'Customer Name', key: 'name', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Medicine Name', key: 'medicineName', width: 30 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Date', key: 'createdAt', width: 20 }
    ];

    customers.forEach(cust => {
      worksheet.addRow({
        name: cust.name,
        phone: cust.phone,
        address: cust.address,
        medicineName: cust.medicineName,
        price: cust.price,
        quantity: cust.quantity,
        totalPrice: cust.totalPrice,
        createdAt: cust.createdAt.toLocaleString()
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sold_medicines.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Error exporting to Excel:', err);
    res.status(500).send('Failed to export data');
  }
});

app.get('/customers/sell', async (req, res) => {
  const medicines = await Medicine.find();
  const successMessage = req.session.successMessage;
  const error = req.session.error;

  req.session.successMessage = null;
  req.session.error = null;

  res.render('customers/sellproducts', {medicines,successMessage,error});
});


app.post('/customers/sell', requireAuth, async (req, res) => {
  const { name, phone, address, medicineName, price, quantity } = req.body;

  const qty = parseInt(quantity);
  const prc = parseFloat(price);

  if (isNaN(qty) || qty < 1) {
    req.session.error = 'Invalid quantity.';
    return res.redirect('/customers/sell');
  }

  try {
    const medicine = await Medicine.findOne({ name: medicineName });

    if (!medicine) {
      req.session.error = 'Medicine not found in stock.';
      return res.redirect('/customers/sell');
    }

    if (medicine.stock < qty) {
      req.session.error = `Only ${medicine.stock} items in stock.`;
      return res.redirect('/customers/sell');
    }

    const totalPrice = prc * qty;

    const newCustomer = new Customer({
      name,
      phone,
      address,
      medicineName,
      price: prc,
      quantity: qty,
      totalPrice
    });

    await newCustomer.save();

    medicine.stock -= qty;
    await medicine.save();

    req.session.successMessage = 'Product sold successfully!';
    res.redirect('/customers');

  } catch (err) {
    console.error('Error selling medicine:', err);
    req.session.error = 'Failed to sell medicine.';
    res.redirect('/customers/sell');
  }
});

app.get('/customers/delete-confirm', requireAuth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.query.id);
    res.render('Customers/deletecustomers', { customer });
  } catch (err) {
    console.error('Error loading customer:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/customers/delete', requireAuth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.body.id);
    req.session.successMessage = 'Customer deleted successfully!';
    res.redirect('/customers');
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).send('Server Error');
  }
});

app.get('/customers/edit/:id', requireAuth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    const medicines = await Medicine.find().sort({ name: 1 });
    res.render('Customers/editcustomers', { customer, medicines });
  } catch (err) {
    console.error('Error loading edit form:', err);
    res.status(500).send('Server Error');
  }
});

app.post('/customers/edit/:id', requireAuth, async (req, res) => {
  const { name, phone, address, medicineName, price } = req.body;

  try {
    await Customer.findByIdAndUpdate(req.params.id, {
      name,
      phone,
      address,
      email: `${medicineName} - Rs. ${price}`
    });

    req.session.successMessage = 'Customer updated successfully!';
    res.redirect('/customers');
  } catch (err) {
    console.error('Error updating customer:', err);
    req.session.error = 'Failed to update customer.';
    res.redirect('/customers/edit/' + req.params.id);
  }
});

app.get('/auth/signup', getSignup);
app.post('/auth/signup', postSignup);
app.get('/auth/login', getLogin);
app.post('/auth/login', postLogin);
app.get('/auth/logout', logout);

app.use(authRoutes);

app.listen(5000, () => {
  console.log("MediStore Manager server is running on http://localhost:5000");
});
