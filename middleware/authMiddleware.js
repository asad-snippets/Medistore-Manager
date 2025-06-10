export const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    next();
};

export const redirectIfAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    next();
};
