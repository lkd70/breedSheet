const { Router } = require('express');

const router = Router();
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const db = require('../db');

const ensureAdmin = () => {
    return [
        ensureLoggedIn('/login'),
        (req, res, next) => {
            if (req.user && req.user.isAdmin === true) {
                next();
            } else {
                res.send('401', 'Unauthorized')
            }
        }
    ]
};

const title = 'LKD70s Breed List - Admin panel';

router.get('/', ensureAdmin(),
    (req, res) => {
        res.render('admin/index', { user: req.user, title, messages: req.flash('info') });
    });

router.get('/user', ensureAdmin(), (req, res) => {
    db.users.getUsers(users => {
        if (req.query.id) {
            db.users.getUserFromId(req.query.id, editing => {
                res.render('admin/user', {
                    user: req.user,
                    title,
                    users,
                    editing
                });
            })
        } else {
            res.render('admin/user', {
                user: req.user,
                title,
                users
            });
        }
    });
});

router.post('/user', ensureAdmin(), (req, res) => {
    if (req.body.id) {
        db.users.updateUserById(req.body.id, {
            name: req.body.name,
            username: req.body.username,
            isAdmin: req.body.isAdmin === 'on',
            isBreeder: req.body.isBreeder === 'on',
            password: req.body.password
        }, err => {
            if (err) {
                req.flash('info', { class: 'danger', message: req.t('failed-update-user')
                    .replace('$USER', req.body.username) });
                res.redirect('/admin/user');
            } else {
                req.flash('info', { class: 'success', message: req.t('updated-user')
                    .replace('$USER', req.body.username) });
                res.redirect('/admin/user');
            }
        });
    } else {
        db.users.addOrUpdateUser({
            name: req.body.name,
            username: req.body.username,
            isAdmin: req.body.isAdmin === 'on',
            isBreeder: req.body.isBreeder === 'on',
            password: req.body.password
        }, result => {
            if (result === null) {
                req.flash('info', { class: 'danger', message: req.t('failed-update-user')
                    .replace('$USER', req.body.username) });
                res.redirect('/admin/user');
            } else {
                req.flash('info', { class: 'success', message: req.t('updated-user')
                    .replace('$USER', req.body.username) });
                res.redirect('/admin/user');
            }
        });
    }
});

router.get('/breeds', ensureAdmin(), (req, res) => {
    db.users.getBreeders(breeders => {
        breeders.push({ name: 'NONE', username: "NONE", _id: "0" });
        if (req.query.id) {
            db.breeds.getBreedById(req.query.id, editing => {
                db.breeds.getBreeds(breeds => {
                    res.render('admin/breed', { breeders, user: req.user, title, breeds, editing })
                })
            });
        } else {
            db.breeds.getBreeds(breeds => {
                const breedinfo = breeds.sort((a, b) => {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });
                res.render('admin/breed', { breeders, user: req.user, title, breeds: breedinfo })
            })
        }
    });
});

router.post('/breeds', ensureAdmin(), (req, res) => {
    db.users.findByUsername(req.body.breeder, (_, ret) => {
        let breeder = 0;
        if (ret !== null) {
            breeder = ret._id;
            if (req.body.id) {
                db.breeds.updateBreedById(req.body.id, {
                    name: req.body.name,
                    breeder,
                    server: req.body.server,
                }, err => {
                    if (err) {
                        req.flash('info', { class: 'danger', message: req.t('failed-update-breed')
                        .replace('$BREED', req.body.name) });
                        res.redirect('/admin/breeds');
                    } else {
                        req.flash('info', { class: 'success', message: req.t('updated-breed')
                            .replace('$BREED', req.body.name) });
                        res.redirect('/admin/breeds');
                    }
                });
            } else {
                db.breeds.addNewBreed({
                    name: req.body.name,
                    breeder,
                    server: req.body.server,
                }, result => {
                    if (result === null) {
                        req.flash('info', { class: 'danger', message: req.t('failed-update-breed')
                            .replace('$BREED', req.body.name) });
                        res.redirect('/admin/breeds');
                    } else {
                        req.flash('info', { class: 'success', message: req.t('updated-breed')
                            .replace('$BREED', req.body.name) });
                        res.redirect('/admin/breeds');
                    }
                })
            }
        } else {
            req.flash('info', { class: 'danger', message: req.t('unknown-breeder')
                .replace('$BREEDER', req.body.breeder) });
            res.redirect('/admin/breeds');
        }
    })
});

router.get('/removeBreed',
    require('connect-ensure-login').ensureLoggedIn(),
    (req, res) => {
        if (req.query.id) {
            db.breeds.removeById(req.query.id, err => {
                console.log(err);
            });
            req.flash('info', { class: 'success', message: req.t('breed-removed') });
            res.redirect('/admin/breeds');
        } else {
            req.flash('info', { class: 'danger', message: req.t('request-remove-error') });
            res.redirect('/admin/breeds');
        }
    });

module.exports = router;
