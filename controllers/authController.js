import User from '../Database/User.js';

export const getSignup = (req, res) => {
  const successMessage = req.session.successMessage || null;
  req.session.successMessage = null;

  res.render('auth/signup', { error: null, successMessage });
};

export const postSignup = async (req, res) => {
  const { shopName, email, shopAddress, phone, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render('auth/signup', { error: 'Passwords do not match', successMessage: null });
  }

  try {
    await User.create({ 
      shopName, 
      email, 
      shopAddress, 
      phone, 
      password 
    });

    // Auto-login after signup
    const user = await User.findOne({ email });
    req.session.userId = user._id;
    req.session.user = {
      _id: user._id,
      email: user.email,
      shopName: user.shopName
    };

    res.redirect('/');
    return;

    req.session.successMessage = 'Account created successfully!';
    res.redirect('/auth/login');
  } 
  catch (err) {
    let errorMessage = 'Registration failed';
    if (err.code === 11000) {
      errorMessage = 'Email already in use';
    }
    res.render('auth/signup', { error: errorMessage, successMessage: null });
  }
};

export const getLogin = (req, res) => {
  res.render('auth/login', { error: null });
};

export const postLogin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return res.render('auth/login', { error: 'Invalid credentials' });
  }

  req.session.userId = user._id;
  req.session.user = {
    _id: user._id,
    email: user.email,
    shopName: user.shopName
  };

  res.redirect('/');
};

export const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/');
    }
    res.redirect('/auth/login');
  });
};

export const getAccount = async (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findById(userId);
    res.render('auth/account', { user, error: null, success: null });
  } catch (err) {
    res.render('auth/account', { user: null, error: 'Failed to load account details', success: null });
  }
};

export const postAccount = async (req, res) => {
  const { shopName, email, phone, shopAddress, oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findById(userId);

    user.shopName = shopName;
    user.email = email;
    user.phone = phone;
    user.shopAddress = shopAddress;

    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.render('auth/account', { user, error: 'All password fields are required to change password', success: null });
      }

      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        return res.render('auth/account', { user, error: 'Old password is incorrect', success: null });
      }

      if (newPassword !== confirmPassword) {
        return res.render('auth/account', { user, error: 'New password and confirm password do not match', success: null });
      }

      user.password = newPassword;
    }

    await user.save();

    req.session.user.shopName = user.shopName;

    res.render('auth/account', { user, error: null, success: 'Profile updated successfully!' });
  } catch (err) {
    res.render('auth/account', { user: null, error: 'Error updating profile', success: null });
  }
};
