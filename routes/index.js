const { Router, request } = require('express');

const router = Router();
const passport = require('passport');
const db = require('../db');

const title = 'LKD70s Breed List';

const formatDateTime = ts => {
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth()}/${d.getDay()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

router.get('/',
  (req, res) => {
    if (req.user) {
      db.requests.getAllRequests(requests => {
        db.breeds.getBreeds(breeds => {
          requests = requests.map(r => ({ user: r.user, done: r.done, timestamp: formatDateTime(r.timestamp), id: r._id, breed: breeds.find(b => b._id === r.breed) }))
          res.render('index', { user: req.user, title, breeds, requests, messages: req.flash('info') });
        })
      });
    } else {
      res.render('index', { user: req.user, title, messages: req.flash('info') });
    }
  });

router.get('/login',
  (req, res) => {
    const messages = req.flash('error').map(m => ({ class: 'danger', message: m}));
    res.render('login', { title, messages });
  });

router.post('/login',
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  (req, res) => {
    res.redirect('/');
  });

router.get('/logout',
  (req, res) => {
    req.logout();
    res.redirect('/');
  });

  router.get('/request',
  require('connect-ensure-login').ensureLoggedIn(),
  (req, res) => {
    db.breeds.getBreeds(breeds => {
      res.render('request', {user: req.user, title, breeds});
    });
  });

  router.get('/remove', 
  require('connect-ensure-login').ensureLoggedIn(),
  (req, res) => {
    if (req.query.id) {
      db.requests.markAsDone(req.query.id, err => {
        console.log(err);
      });
      req.flash('info', { class: 'success', message: req.t('request-removed') });
      res.redirect('/requests');
    } else {
      req.flash('info', { class: 'danger', message: req.t('request-remove-error') });
      res.redirect('/requests');
    }
  });

  router.post('/request', 
  require('connect-ensure-login').ensureLoggedIn(),
  (req, res) => {
    db.requests.addNewRequest({ breed: req.body.breed, user: req.user._id}, result => {
      if (result === null) {
        req.flash('info', { class: 'danger', message: req.t('request-add-error') });
        res.redirect('/requests');
      } else {
        db.breeds.getBreedById(req.body.breed, b => {          
          req.flash('info', { class: 'success', message: req.t('added-to-requests').replace('$BREED', b.name) });
          res.redirect('/requests');
        })
      }
    })
  });

  router.get('/requests',
  (req, res) => {
    db.breeds.getBreeds(breeds => {
      if (req.query.breed) {
        db.requests.getNewRequestsByBreedId(req.query.breed, requests => {
          if (requests !== null) {
            db.users.getUsernamePerId(users => {
              requests = requests.map(r => {
                const name = users.find(o => o.id === r.user);
                return { name, t: r.timestamp, timestamp: formatDateTime(r.timestamp), user: r.user, id: r._id };
              })
              
              const breed = breeds.find(b => b._id === req.query.breed);
              requests = requests.sort((a, b) => new Date(a.t) - new Date(b.t)); 
              res.render('requests', { user: req.user, title, breed, breeds, requests});
            });
          } else {
            req.flash('info', { class: 'danger', message: req.t('requests-fetch-fail') });
            res.redirect('/')
          }
        })
      } else {
        res.render('requests', {user: req.user, title, breeds});
      }        
    });
  });

module.exports = router;
