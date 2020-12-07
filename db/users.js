const Datastore = require('nedb');
const db = new Datastore({ filename: './data/users', autoload: true });

const admin = {
  name: 'admin',
  username: 'admin',
  isAdmin: true,
  password: 'changeme',
  isBreeder: true,
}

exports.addDefaultAdmin = () => {
  db.findOne({ name: admin.name, username: admin.username }, (err, doc) => {
    if (err || doc === null) {
      console.log('Added default admin. Please chnage the password asap');
      db.insert(admin);
    }
  });
};

exports.findById = (id, cb) => {
  db.findOne({ _id: id }, (err, doc) => {
    if (err || doc === null) {
      cb(new Error(`User ${id} does't exist`));
    } else {
      cb(null, doc);
    }
  })
};

exports.getUsernameFromId = (id, cb) => {
  db.findOne({ _id: id }, (err, doc) => {
    console.log('doc: ' + doc.username);
    if (err) {
      cb('');
    } else {
      cb(doc.username);
    }
  })
};

exports.getUsernamePerId = (cb) => {
  db.find({}, (err, docs) => {
    cb(docs.map(d => ({username: d.username, id: d._id})))
  })
}

exports.findByUsername = (username, cb) => {
  db.findOne({ username: username }, (err, doc) => {
    if (err || doc === null) {
      cb(null, null);
    } else {
      return cb(null, doc);
    }
  })
};

exports.addOrUpdateUser = (details, cb) => {
  if (details.name === 'NONE') cb(null);
  db.findOne({ username: details.username }, (err, doc) => {
    if (err || doc === null) {
      db.insert(details, (err, newDoc) => {
        if (err || newDoc === null) {
          cb(null)
        } else {
          cb(newDoc);
        }
      });
    } else {
      db.update({ username: details.username }, details);
      db.findOne({ username : details.username}, (err, updatedDoc) => {
        if (err || updatedDoc === null ) {
          cb(null)
        } else {
          cb(updatedDoc);
        }
      })
    }
  })
};

exports.getUsers = cb => {
  db.find({}, (err, res) => {
    if (err || res.length === 0) {
      cb([]);
    } else {
      cb(res);
    }
  });
};

exports.getUserFromId = (id, cb) => {
  db.findOne({_id: id}, (err, res) => {
    if (err || res.length === 0) {
      cb(null);
    } else {
      cb(res);
    }
  });
};

exports.getBreeders = cb => {
  db.find({ isBreeder: true }, (err, res) => {
    if (err || res.length === 0) {
      cb([]);
    } else {
      cb(res);
    }
  });
};

exports.updateUserById = (id, details, cb) => {
  db.update({_id: id}, details, err => {
    cb(err);
  })
};