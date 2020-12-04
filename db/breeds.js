const Datastore = require('nedb');
const db = new Datastore({ filename: './data/breeds', autoload: true });

exports.addNewBreed = (breed, cb) => {
    db.findOne({ name: breed.name }, (err, doc) => {
        if (err || doc === null) {
            db.insert({
                name: breed.name,
                breeder: breed.breeder,
                server: breed.server,
            }, (err, doc) => {
                if (err || doc === null) {
                    cb(null);
                } else {
                    cb(doc._id);
                }
            });
        } else {
            db.update({ name: breed.name }, {
                name: breed.name,
                breeder: breed.breeder,
                server: breed.server,
            }, err => {
                if (err) {
                    cb(err)
                } else {
                    cb(doc._id);
                }
            });
        }
    })
};

exports.getBreeds = cb => {
    db.find({}, (err, docs) => {
        if (err) docs = [];
        cb(docs);
    })
};

exports.getBreedById = (id, cb) => {
    db.findOne({ _id: id}, (err, doc) => {
        if (err || doc === null) {
            cb(null);
        } else {
            cb(doc);
        }
    });
};

exports.getBreedsByBreederId = (id, cb) => {
    db.find({ breeder: id }, (err, docs) => {
        if (err || docs === null) {
            cb(null);
        } else {
            cb(docs);
        }
    });
};