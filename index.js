const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const port = 3000
const Str = require('@supercharge/strings')
const db = require('quick.db')
const fs = require('fs');

app.use(fileUpload());
app.set('view engine', 'ejs')
app.use(express.static('upload'))
app.use('/img', express.static(__dirname + 'upload'))

app.get('/', function(req, res) {
  const filenames = fs.readdirSync(__dirname + '/upload/');
  const fileWithout = []
  filenames.forEach((file) => {
    fileWithout.push(file.split('.')[0])
    return console.log(file.split('.')[0])
  })
  res.render('index', {
    db: db,
    files: fileWithout
  })  
})

app.get('/sendvideo', (req, res) => {
    res.render('sendvideo', {
        err: req.query.err
    })
})

app.get('/video', (req, res) => {
  if (!req.query.v) return res.render('videonotfound')
  res.render('video', {
    likeup: db.get(`${req.query.v}_like_up`) || 0,
    likedown: db.get(`${req.query.v}_like_down`) || 0,
    views: db.get(`${req.query.v}_like_views`) || 0,
    path: `http://localhost:3000/${req.query.v}.mp4`,
    pathlike: `http://localhost:3000/likeup?v=${req.query.v}`,
    pathdislike: `http://localhost:3000/dislike?v=${req.query.v}`
  })
  db.add(`${req.query.v}_like_views`, 1)
})

app.get('/likeup', (req, res) => {
  if (!req.query.v) return res.render("404")
  db.add(`${req.query.v}_like_up`, 1)
  return res.redirect(`http://localhost:3000/video?v=${req.query.v}`)
})

app.get('/dislike', (req, res) => {
  if (!req.query.v) return res.render("404")
  db.add(`${req.query.v}_like_down`, 1)
  return res.redirect(`http://localhost:3000/video?v=${req.query.v}`)
})

app.post('/upload', async function(req, res) {
  let sampleFile;
  let uploadPath;
  let nameFile;
  var finalExtentionUploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.redirect('http://localhost:3000/sendvideo?err=Nie%20wysłano%20pliku!')
    return
  }

  nameFile = Str.random(5)
  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + '/upload/' + nameFile;
  console.log(req.files.sampleFile.mimetype)
  if (req.files.sampleFile.mimetype == "video/mp4") {
    uploadPath = uploadPath + ".mp4"
  } else {
    await res.redirect('http://localhost:3000/sendvideo?err=Nie%20poprawny%20format%20pliku!')
    return;
  }
  console.log(uploadPath)
  sampleFile.mv(uploadPath, async function(err) {
      if (err) return res.status(500).render('500sendvideo');
      res.redirect(`http://localhost:3000/video?v=${nameFile}`)
      db.set(`${nameFile}_like_up`, 0)
      db.set(`${nameFile}_like_down`, 0)
      db.set(`${nameFile}_like_views`, 0)
  });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
