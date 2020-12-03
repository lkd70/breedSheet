const Datastore = require('nedb');
const db = new Datastore({ filename: './data/requests', autoload: true });
const breedsDB = require('./breeds');

exports.addNewRequest = (req, cb) => {
    db.findOne({ user: req.user, breed: req.breed, done: false}, (err, doc) => {
        if (err || doc === null) {
            db.insert({ user: req.user, breed: req.breed, done: false, timestamp: Date.now() }, (err, newDoc) => {
                if (err || newDoc === null) {
                    cb(null);
                } else {
                    cb(newDoc);
                }
            })
        } else {
            cb(doc);
        }
    })

};

exports.getNewRequestsByBreedId = (breed_id, cb) => {
    breedsDB.getBreedById(breed_id, doc => {
        if (doc === null) {
            cb(null);
        } else {
            db.find({ breed: doc._id, done: false }, (err, docs) => {
                if (err) docs = [];
                cb(docs);
            }) 
        }
    });
};