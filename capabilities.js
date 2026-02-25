module.exports = [
  {
    browserName: "Chrome",
    "bstack:options": {
      os: "Windows",
      osVersion: "10",
      sessionName: "Windows Chrome"
    }
  },
  {
    browserName: "Firefox",
    "bstack:options": {
      os: "Windows",
      osVersion: "11",
      sessionName: "Windows Firefox"
    }
  },
  {
    browserName: "Safari",
    "bstack:options": {
      os: "OS X",
      osVersion: "Ventura",
      sessionName: "Mac Safari"
    }
  },
  {
    browserName: "Chrome",
    "bstack:options": {
      deviceName: "Samsung Galaxy S22",
      osVersion: "12.0",
      realMobile: "true",
      sessionName: "Android Chrome"
    }
  },
  {
    browserName: "Safari",
    "bstack:options": {
      deviceName: "iPhone 14",
      osVersion: "16",
      realMobile: "true",
      sessionName: "iPhone Safari"
    }
  }
];