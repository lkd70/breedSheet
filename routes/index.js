const { Router, request } = require('express');

const router = Router();
const passport = require('passport');
const db = require('../db');

const title = 'LKD70\'s Breed List';

router.get('/',
  (req, res) => {
    res.render('index', { user: req.user, title });
  });

router.get('/login',
  (req, res) => {
    res.render('login', { title });
  });

router.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
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

  router.post('/request', 
  require('connect-ensure-login').ensureLoggedIn(),
  (req, res) => {
    console.log(req.user);
    db.requests.addNewRequest({ breed: req.body.breed, user: req.user._id}, result => {
      if (result === null) {
        res.send('An error occurred');
      } else {
        res.send('You are in the waiting list for ' + req.body.breed);
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
              console.log('USERS:' + users);
              requests = requests.map(r => {
                const name = users.find(o => o.id === r.user);
                return { name, timestamp: r.timestamp };
              })
              requests = requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); 
              res.render('requests', { user: req.user, title, breed: req.query.breed, breeds, requests});
            });
            
          } else {
            res.send('An error occurred');
          }
        })
      } else {
        res.render('requests', {user: req.user, title, breeds});
      }        
    });

  });

module.exports = router;
