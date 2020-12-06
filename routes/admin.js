const { Router } = require('express');

const router = Router();
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const usersDb = require('../db/users');
const breedsDb = require('../db/breeds');

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
    res.render('admin/user', { user: req.user, title });
});

router.post('/user', ensureAdmin(), (req, res) => {
    usersDb.addOrUpdateUser({ 
        name: req.body.name,
        username: req.body.username,
        isAdmin: req.body.isAdmin === 'on',
        isBreeder: req.body.isBreeder === 'on',
        password: req.body.password
    }, result => {
        if (result === null) {
            req.flash('info', { class: 'danger', message: req.t('failed-update-user').replace('$USER', req.body.username) });
            res.redirect('/admin');
        } else {
            req.flash('info', { class: 'success', message: req.t('updated-user').replace('$USER', req.body.username) });
            res.redirect('/admin');
        }
    });
});

router.get('/breeds', ensureAdmin(), (req, res) => {
    usersDb.getBreeders(breeders => {
        breeders.push({name: 'NONE', username: "NONE", _id: "0"});
        breedsDb.getBreeds(breeds => {
            res.render('admin/breed', { breeders, user: req.user, title, breeds })
        })
    });
})

router.post('/breeds', ensureAdmin(), (req, res) => {
    usersDb.findByUsername(req.body.breeder, (_, ret) => {
        let breeder = 0;
        if (ret !== null) {
            breeder = ret._id;
            breedsDb.addNewBreed({
                name: req.body.name,
                breeder,
                server: req.body.server,
            }, result => {
                if (result === null) {
                    req.flash('info', { class: 'danger', message: req.t('failed-update-breed').replace('$BREED', req.body.name) });
                    res.redirect('/admin');
                } else {
                    req.flash('info', { class: 'success', message: req.t('updated-breed').replace('$BREED', req.body.name) });
                    res.redirect('/admin');
                }
            })
        } else {
            req.flash('info', { class: 'danger', message: req.t('unknown-breeder').replace('$BREEDER', req.body.breeder) });
            res.redirect('/admin');
        }
    })
})

module.exports = router;
