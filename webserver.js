//Express를 이용한 서버 구축
const express = require('express');
const app = express();

//socket 셋팅
//http 모듈안에 express앱을 전달해 서버를 생성
const http = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(http);


//환경변수
// require('dotenv').config();

//미들웨어
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}))



//미들웨어, static file들은 public폴더에서 관리하겠다. (정적파일 예)이미지)
app.use('/public', express.static('public'))
//method override lib
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

//쿠키
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//passport
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

//세션
const session = require('express-session');
app.use(session({
    secret: '1111',
    resave: false,
    saveUninitialized: true
}));

//passport 미들웨어 설정
app.use(passport.initialize());
app.use(passport.session());


//라우트 미들웨어 설정
// localhost/일때 webtoon.js을 참조하겠다
app.use('/', require('./routes/webtoon.js'))
app.use('/', require('./routes/list.js'))



//ejs
app.set('view engine', 'ejs');

//MongoDB
const mongoClient = require('mongodb').MongoClient;


var db;
mongoClient.connect('mongodb+srv://admin:1234@cluster0.zaywpyx.mongodb.net/?retryWrites=true&w=majority', function(err, client){
    if(err){
        return console.log(err);
    }

    db = client.db('TodoApp');

    // app.db = db;

    app.listen(8080, function(){      //(port, 콜백함수)
        console.log('listening on 8080');
    })
})



// app.listen(process.env.PORT, function(){
    //     console.log('listening on 9000');
    // })
//     http.listen(process.env.PORT, function(){
//         console.log('listening on 9000');
// })




//home 라우터
app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.get('/write', (req, res) => {
    res.render('write.ejs')
})

app.post('/add', function(req, res){
    console.log(req.body.title)     
    console.log(req.body.date)    
    res.send('전송완료');  


    //MongoDB
    db.collection('counter').findOne({name:'postcnt'}, function(err, result){
        if(err) return console.log(err);
        // console.log(result.totalPost);
        var totalCount = result.totalPost;

        //post 컬렉션
        db.collection('post').insertOne({_id : totalCount + 1, todo : req.body.title, date : req.body.date, }, function(err, result){
            console.log('저장완료');

            db.collection('counter').updateOne({name : 'postcnt'}, { $inc : {totalPost : 1}}, function(err, result){
            //totalPost 1만큼 증가
            if(err) return console.log(err);
            })
        })
    }); 
    // res.redirect("/");
    res.send('전송완료');
})

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, result){
        console.log(result);
        res.render('list.ejs', {posts : result});
    });
});



//todo list에서 삭제버튼
app.delete('/delete', function(req, res){

    console.log(req.body._id);
    
    req.body._id = parseInt(req.body._id);

    // var deleteData = {_id : req.body._id, writer : req.user._id} //post의 _id, login의 _id

    db.collection('post').deleteOne(deleteData, function(err,result){
        if(err) return console.log(err);

        console.log('삭제 성공');
        //몇개의 게시글을 삭제했는지 확인
        console.log(result.deletedCount);
        res.status(200).send({message : '성공했습니다.'}) //상태 전달
    }) 
});



//각 리스트의 상세페이지
//localhost:8080:/detail/1, /detail/2, /detail/3 ... 형태
//한 개의 ejs file로 여러개의 페이지 동적 구성 가능
//ejs file에 전달인자를 객체 형태로 넘겨주자.
app.get('/detail/:id', (req, res)=>{ // 여기서의 id : url의 parameter(매개변수)
    console.log('상세페이지', req.params.id)
    //req.params.id : 요청정보의 파라미터인 id
    db.collection('post').findOne({_id : parseInt(req.params.id)}, (err, result)=>{
        if(err) console.log(err)
        console.log(result)
        res.render('detail.ejs', {data: result}) 
    })
})

//write에서 수정버튼 클릭 이동 페이지
app.get('/edit/:id',(req, res)=>{
    console.log(req.params.id)

    db.collection('post').findOne({_id : parseInt(req.params.id)}, (err, result)=>{
        if(err) console.log(err)
        console.log(result)
        res.render('edit.ejs', {post: result})  
    })

})

//edit.ejs - form의 put요청(action)을 methodOverride방식으로 처리
app.put('/edit', (req, res)=>{
    //form의 todo, date 데이터를 db에 update
    console.log('업데이트 합니다.')
    db.collection('post').updateOne({_id: parseInt(req.body.id)}, {$set: {todo: req.body.title, date: req.body.date}}, (err, result)=>{
        if(err) console.log(err)
        console.log('수정 완료')
        res.redirect("/list");
    })
})
// conn.end()


//쿠키
app.get('/count', function(req, res){
    if(req.cookies.count){
        var count = parseInt(req.cookies.count);
    }else{
        var count = 0;
    }
    count += 1;
    res.cookie('count', count);
    res.send('count : ' + count);
})


//세션
app.get('/count', function(req, res){
    if(req.session.count){
        req.session.count++;
    }else{
        req.session.count = 1;
    }    
    res.send('count : ' + req.session.count);
})

app.get('/temp', function(req, res){
    res.send('result : ' + req.session.count);
})


//로그인 라우터
app.get('/login',(req, res) => {
    res.render('login.ejs');
});

app.post('/login',(req, res) => {
    let userid = req.body.id;
    let userpw = req.body.pw;

    console.log(userid);
    console.log(userpw);

    db.collection('login').findOne({id : userid}, function(err, result){
        if(err) return console.log(err);
        if(!result){
            res.send('존재하지 않는 아이디입니다.');
        }else{
            console.log(result);
            if(result.pw == userpw){
                res.redirect('/');
            }else{
                res.redirect('/login');
            }
        }        
    })
});


//passport를 이용한 인증 방식
app.post('/login', passport.authenticate('local', {
            failureRedirect : '/fail'
        }),(req, res) => {
        res.redirect('/');
    
});

passport.use(new LocalStrategy({
    usernameField : 'id',
    passwordField : 'pw',
    session : true,
    passReqToCallback : false,
    }, function(inputid, inputpw, done){
    console.log(inputid);
    console.log(inputpw);

    db.collection('login').findOne({id : inputid}, function(err, result){
        if(err) return done(err);
        if(!result) {
            return done(null, false, {message : '존재하지 않는 아이디입니다.'})
        }
        if(result.pw == inputpw){
            return done(null, result);   //serializeUser의 user 매개변수로 넘어감
        }else{
            return done(null, false, {message : '비번이 틀렸어요'})
        }
    })
}));
passport.serializeUser(function(user, done){
    done(null, user.id);  //사용자의 id를 세션 아이디로 쿠키에 저장
});

passport.deserializeUser(function(userid, done){  //세션 아이디
    db.collection('login').findOne({id : userid}, function(err, result){
        done(null, result);
        console.log(result);
    })
    
});


app.get('/fail', (req, res) => {
    res.send('로그인 해주세요');
})

//회원가입 라우터
app.get('/signup',(req, res) => {
    res.render('signup.ejs');
});
app.post('/signup',(req, res) => {
    db.collection('login').insertOne({
        id : req.body.id, 
        pw : req.body.pw,
        mobile : req.body.mobile,
        country : req.body.country
    }, function(err, result){
        if(err) return console.log(err);
        console.log('저장완료');
        console.log(result);
        res.redirect('/login');
    })
    
});

//마이페이지 라우터
//마이페이지를 요청하면 islogin 미들웨어를 실행 -> request에 user 정보가 있다면 next로 넘어가기
app.get('/mypage', islogin, (req, res) => {
    res.render('mypage.ejs', {loginuser : req.user});
});

function islogin(req, res, next){
    if(req.user){
        next();
    }else{
        res.send('로그인해주세요');
    }
}

//Query String
app.get('/search', (req, res) => {
    console.log(req.query.value);
    //일반적인 순차 검색
    //여러개를 찾아(find) 배열 형태로 저장(toArray)
    // db.collection('post').find({todo : /보기/}).toArray((err, result) => {
    // db.collection('post').find({todo : req.query.value}).toArray((err, result) => {
    //     console.log(result);
    //     // res.render('list.ejs', {posts : result})
    //     res.render('search.ejs', {posts : result});
    // })

    //바이너리 검색
    db.collection('post').find({$text : {$search : req.query.value}}).toArray((err, result) => {
        console.log(result);
        res.render('search.ejs', {posts : result});
    })
});



//작성자 추가  //passport의 user를 가져옴 => 회원가입시 저장된 _id
app.post('/add', function(req, res){
    
    db.collection('counter').findOne({name:'postcnt'}, function(err, result){
        if(err) return console.log(err);
        console.log(result.totalPost);
        var totalCount = result.totalPost;

        db.collection('post').insertOne({_id : totalCount + 1, writer : req.user._id, todo : req.body.title, date : req.body.date, }, function(err, result){
            console.log('저장완료');

            db.collection('counter').updateOne({name : 'postcnt'}, { $inc : {totalPost : 1}}, function(err, result){
            //totalPost 1만큼 증가
            if(err) return console.log(err);

            })
        })
    }); 
    res.redirect("/");
    
})



//multer 설정
let multer = require('multer');
const { Socket } = require('dgram');

let storage = multer.diskStorage({
    destination : function(req, res, cb){
        cb(null, './public/image')
    }, 
    filename : function(req, file, cb){
        cb(null, file.originalname)
    }
});

let upload = multer({storage : storage})



//이미지업로드 라우터
app.get('/upload', function(req, res){
    res.render('upload.ejs');
})

app.post('/upload', upload.single('profile'), function(req, res){
    res.send('업로드 완료');
})

app.get('/image/:imgname', function(req, res){
    res.sendFile(__dirname + '/public/image/' + req.params.imgname);
})




//socket
app.get('/socket', (req, res) => {
    res.render('socket.ejs');
})


io.on('connection', (socket)=>{
    console.log('유저 접속중');

    socket.on('room1-send', (data) => {
        io.to('room1').emit('broadcast', data);
    })

    socket.on('joinroom', (data) => {
        console.log(data);
        socket.join('room1');
    })

    socket.on('user-send', (data) => {
        console.log(data);

        // io.emit('broadcast', data) //에코서버 => 클라이언트의 메시지에 바로 답장하는 것 //서버테스트에 주로 사용
        io.to(socket.id).emit('broadcast', data)  
        //이 소켓에 접속된 클라이언트만 메시지를 받을 수 있도록
        //서버랑 1대1로 통신
    })    
})