const router = require("express").Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.post(
  "/generate-zego-token",
  authController.protect,
  userController.generateZegoToken
);
router.get("/get-call-logs", authController.protect, userController.getCallLogs);
router.get("/get-me", authController.protect, userController.getMe);
router.patch("/update-me", authController.protect, userController.updateMe);
router.get("/get-all-verified-users", authController.protect, userController.getAllVerifiedUsers);
router.get("/get-users", authController.protect, userController.getUsers);
router.get("/get-requests", authController.protect, userController.getRequests);
router.get("/get-friends", authController.protect, userController.getFriends);

router.post("/start-audio-call", authController.protect, userController.startAudioCall);
router.post("/start-video-call", authController.protect, userController.startVideoCall);

router.get("/get-user-details", authController.protect,  userController.userDashbohardData);
router.get("/get-user-course-list", authController.protect,  userController.getUserCourseList);
router.get("/check-user-qualification", authController.protect,  userController.checkVerification);
router.post("/message-admin", authController.protect,  userController.messageAdmin);
router.get("/get-user-coursemates", authController.protect,  userController.getUserCourseMates);
router.get("/get-coursemate-profile", authController.protect,  userController.getCourseMateProfile);

module.exports = router;
