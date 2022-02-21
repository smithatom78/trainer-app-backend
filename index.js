const express = require('express');
const cors = require('cors');
const UserLoginInfo = require('./src/model/TrainerDB');

//object init
const app = express();
app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const jwt = require('jsonwebtoken');
const bcrpt = require('bcrypt');
app.get('/', function (req, res) {
    res.send("trainer server up");
});
/*app.post('/', function (req, res) {
    res.send(`hi ${req.body.name} trainerpost`);
});*/

//routing register
app.post("/api/register", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
    res.setHeader('Access-Control-Allow-Credentials', true)
    try {
        UserLoginInfo.find({ email: req.body.email }, (err, data) => {
            if (data.length == 0) {
                let user = new UserLoginInfo({
                   
                    email: req.body.email,
                    password: bcrpt.hashSync(req.body.password, 10),
                    utype: req.body.utype
                })
                let result = user.save((err, data) => {
                    if (err) {
                        res.json({ status: 'error happened' })
                    }
                    else {
                        res.json({ status: 'sucesss' })
                    }
                })
            }
            else {
                res.json({ status: 'email id already exists' })
            }
        })
    }
    catch (error) {
        res.json({ status: 'error' })

    }
})

//login
//login authentication routing
app.post('/api/userlogin', async (req, res) => {

    try {
        if (req.body.email == undefined || req.body.password == undefined) {
            res.status(500).send({ error: "authentication failed" });
        }
        console.log(req.body)
        var userEmail = req.body.email
        var userPass = req.body.password
        let result = UserLoginInfo.find({ email: userEmail }, (err, data) => {
            if (data.length > 0) {
                const passwordValidator = bcrpt.compareSync(userPass, data[0].password)
                console.log(passwordValidator)
                if (passwordValidator) {
                    // token generation
                    jwt.sign({ email: data[0].email, id: data[0]._id },
                        'godblessu',
                        { expiresIn: '1d' },
                        (err, token) => {
                            if (err) {
                                res.json({ status: 'error in token generation' })
                            }
                            else {
                                res.json({ status: 'login success', token: token })
                                req.session.loggedin = true;

                            }
                        }

                    )


                    /////////


                }
                else {
                    res.json({ status: 'invalid password' })

                }

            }
            else {
                res.json({ status: 'invalid email id' })

            }
        })




    }
    catch (error) {
        res.json({ status: 'error' })

    }

})

//listening to port

//app.listen(process.env.PORT || 5000, () => { console.log(`Listening on port ${process.env.PORT} or 5000`) });
//listening to port

app.listen(5000,()=>{console.log("listening on port 5000")});
