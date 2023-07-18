const AudioCall = require("../models/audioCall");
const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const AdminMessage = require("../models/admin");
const VideoCall = require("../models/videoCall");
const catchAsync = require("../utils/catchAsync");
const filterObj = require("../utils/filterObj");

const { generateToken04 } = require("./zegoServerAssistant");

// Please change appID to your appId, appid is a number
// Example: 1234567890
const appID = process.env.ZEGO_APP_ID; // type: number

// Please change serverSecret to your serverSecret, serverSecret is string
// Example：'sdfsdfsd323sdfsdf'
const serverSecret = process.env.ZEGO_SERVER_SECRET; // type: 32 byte length string

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: req.user,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "about",
    "avatar"
  );

  const userDoc = await User.findByIdAndUpdate(req.user._id, filteredBody);

  res.status(200).json({
    status: "success",
    data: userDoc,
    message: "User Updated successfully",
  });
});

exports.getUsers = catchAsync(async (req, res, next) => {
  const all_users = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  const this_user = req.user;

  const remaining_users = all_users.filter(
    (user) =>
      !this_user.friends.includes(user._id) &&
      user._id.toString() !== req.user._id.toString()
  );

  res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users found successfully!",
  });
});

exports.getAllVerifiedUsers = catchAsync(async (req, res, next) => {
  const all_users = await User.find({
    verified: true,
  }).select("firstName lastName _id");

  console.log(all_users)

  const remaining_users = all_users.filter(
    (user) => user._id.toString() !== req.user._id.toString()
  );

  res.status(200).json({
    status: "success",
    data: remaining_users,
    message: "Users found successfully!",
  });
});

exports.getRequests = catchAsync(async (req, res, next) => {
  const requests = await FriendRequest.find({ recipient: req.user._id })
    .populate("sender")
    .select("_id firstName lastName");

  res.status(200).json({
    status: "success",
    data: requests,
    message: "Requests found successfully!",
  });
});

exports.getFriends = catchAsync(async (req, res, next) => {
  const this_user = await User.findById(req.user._id).populate(
    "friends",
    "_id firstName lastName"
  );
  res.status(200).json({
    status: "success",
    data: this_user.friends,
    message: "Friends found successfully!",
  });
});

/**
 * Authorization authentication token generation
 */

exports.generateZegoToken = catchAsync(async (req, res, next) => {
  try {
    const { userId, room_id } = req.body;

    console.log(userId, room_id, "from generate zego token");

    const effectiveTimeInSeconds = 3600; //type: number; unit: s; token expiration time, unit: second
    const payloadObject = {
      room_id, // Please modify to the user's roomID
      // The token generated allows loginRoom (login room) action
      // The token generated in this example allows publishStream (push stream) action
      privilege: {
        1: 1, // loginRoom: 1 pass , 0 not pass
        2: 1, // publishStream: 1 pass , 0 not pass
      },
      stream_id_list: null,
    }; //
    const payload = JSON.stringify(payloadObject);
    // Build token
    const token = generateToken04(
      appID * 1, // APP ID NEEDS TO BE A NUMBER
      userId,
      serverSecret,
      effectiveTimeInSeconds,
      payload
    );
    res.status(200).json({
      status: "success",
      message: "Token generated successfully",
      token,
    });
  } catch (err) {
    console.log(err);
  }
});

exports.startAudioCall = catchAsync(async (req, res, next) => {
  const from = req.user._id;
  const to = req.body.id;

  const from_user = await User.findById(from);
  const to_user = await User.findById(to);

  // create a new call audioCall Doc and send required data to client
  const new_audio_call = await AudioCall.create({
    participants: [from, to],
    from,
    to,
    status: "Ongoing",
  });

  res.status(200).json({
    data: {
      from: to_user,
      roomID: new_audio_call._id,
      streamID: to,
      userID: from,
      userName: from,
    },
  });
});

exports.startVideoCall = catchAsync(async (req, res, next) => {
  const from = req.user._id;
  const to = req.body.id;

  const from_user = await User.findById(from);
  const to_user = await User.findById(to);

  // create a new call videoCall Doc and send required data to client
  const new_video_call = await VideoCall.create({
    participants: [from, to],
    from,
    to,
    status: "Ongoing",
  });

  res.status(200).json({
    data: {
      from: to_user,
      roomID: new_video_call._id,
      streamID: to,
      userID: from,
      userName: from,
    },
  });
});

exports.getCallLogs = catchAsync(async (req, res, next) => {
  const user_id = req.user._id;

  const call_logs = [];

  const audio_calls = await AudioCall.find({
    participants: { $all: [user_id] },
  }).populate("from to");

  const video_calls = await VideoCall.find({
    participants: { $all: [user_id] },
  }).populate("from to");

  console.log(audio_calls, video_calls);

  for (let elm of audio_calls) {
    const missed = elm.verdict !== "Accepted";
    if (elm.from._id.toString() === user_id.toString()) {
      const other_user = elm.to;

      // outgoing
      call_logs.push({
        id: elm._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    } else {
      // incoming
      const other_user = elm.from;

      // outgoing
      call_logs.push({
        id: elm._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    }
  }

  for (let element of video_calls) {
    const missed = element.verdict !== "Accepted";
    if (element.from._id.toString() === user_id.toString()) {
      const other_user = element.to;

      // outgoing
      call_logs.push({
        id: element._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    } else {
      // incoming
      const other_user = element.from;

      // outgoing
      call_logs.push({
        id: element._id,
        img: other_user.avatar,
        name: other_user.firstName,
        online: true,
        incoming: false,
        missed,
      });
    }
  }

  res.status(200).json({
    status: "success",
    message: "Call Logs Found successfully!",
    data: call_logs,
  });
});

const faculties =['set','sat','seet','soc']

const schoolFacultyOfficials = [
  // 'set','sat','seet','soc'
 {id: 'set', data: {vc: 'meee', so: 'you'}},
 {id: 'sat', data: {vc: 'treasure', so: 'treasure'}},
 {id: 'seet', data: {vc: 'owoade', so: 'prevail'}},
 {id: 'soc', data: {vc: 'prevail', so: 'owoade'}},

]

exports.userDashbohardData = catchAsync(async (req, res, next) => {
  const user_id = req.user._id;
  const user = await User.findOne({ _id: user_id })

  if (!user ) {
    res.status(400).json({
      status: "error",
      message: "user not found",
    });
    return;
  }
   //check user data
   const {faculty, department, level} = user
  const  mappedFaculty = schoolFacultyOfficials.filter((data) => {
    return data.id === faculty
  })

  res.status(200).json({
    status: "success",
    message: "User Details Found successfully!",
    data: {
      mappedFaculty
    },
  });
});


//admin route
exports.verifyQualification = catchAsync(async (req, res, next) => {
  const user = await User.find()

  const filteredUser = user.filter((data)=> data.nickname === req.body.verifyUser)

  filteredUser.verifiedQualification = true
  filteredUser.save()

  res.status(200).json({
    status: "success",
    message: "User Details Found successfully!",
    data: `user with nickname ${filteredUser} has been verified`
  });
});
////

exports.requestAutorization = catchAsync(async (req, res, next) => {
  const user_id = req.user._id;
  const user = await User.findOne({ _id: user_id })

  //check if user exist
  if (!user ) {
    res.status(400).json({
      status: "error",
      message: "user not found",
    });
    return;
  }
 
  if (!user.verifiedQualification ) {
    res.status(400).json({
      status: "error",
      message: "user not autorized",
    });
    return;
  }

  res.status(200).json({
    status: "success",
    message: "This user is autorized",
    data: true
  });
});

////

exports.messageAdmin = catchAsync(async (req, res, next) => {
  const user_id = req.user._id;
  const {nickname, faculty, level, message} = req.body
  const user = await User.findOne({ _id: user_id })

  //check if user exist
  if (!user ) {
    res.status(400).json({
      status: "error",
      message: "user not found",
    });
    return;
  }
 
  const creatAdminMessage = await AdminMessage.create({
    user_id, nickname, faculty, level, message
  })

  res.status(200).json({
    status: "success",
    message: "Admin will get back to you",
    data: creatAdminMessage
  });
});
