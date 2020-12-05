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
    if (req.user && req.user.isBreeder) {
      db.breeds.getBreedsByBreederId(req.user._id, breeds => {
        res.render('index', { user: req.user, title, breeds, messages: req.flash('info') });
      })
    } else {
      res.render('index', { user: req.user, title, messages: req.flash('info') });
    }
  });

router.get('/login',
  (req, res) => {
    const messages = req.flash('error').map(m => ({ class: 'danger', message: m}));
    console.log(messages);
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
      req.flash('info', { class: 'success', message: 'successfully removed request' });
      res.redirect('/');
    } else {
      req.flash('info', { class: 'danger', message: 'An error occurred whilst removing the request' });
      res.redirect('/');
    }
  });

  router.post('/request', 
  require('connect-ensure-login').ensureLoggedIn(),
  (req, res) => {
    db.requests.addNewRequest({ breed: req.body.breed, user: req.user._id}, result => {
      if (result === null) {
        req.flash('info', { class: 'danger', message: 'An error occurred whilst adding the request' });
        res.redirect('/');
      } else {
        req.flash('info', { class: 'success', message: 'You are in the waiting list for ' + req.body.breed});
        res.redirect('/');
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
            req.flash('info', { class: 'danger', message: 'an error occurred whilst receiving the requests' });
            res.redirect('/')
          }
        })
      } else {
        res.render('requests', {user: req.user, title, breeds});
      }        
    });
  });

module.exports = router;
