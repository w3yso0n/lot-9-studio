const fs = require("node:fs");

function normalizeReadlinkError(error) {
  if (error && error.code === "EISDIR" && String(error.syscall).includes("readlink")) {
    error.code = "EINVAL";
  }
  return error;
}

const originalReadlinkSync = fs.readlinkSync.bind(fs);
fs.readlinkSync = function patchedReadlinkSync(...args) {
  try {
    return originalReadlinkSync(...args);
  } catch (error) {
    throw normalizeReadlinkError(error);
  }
};

const originalReadlink = fs.readlink.bind(fs);
fs.readlink = function patchedReadlink(...args) {
  const callback = args[args.length - 1];
  if (typeof callback !== "function") {
    return originalReadlink(...args);
  }

  args[args.length - 1] = (error, ...rest) => {
    callback(error ? normalizeReadlinkError(error) : error, ...rest);
  };
  return originalReadlink(...args);
};

if (fs.promises?.readlink) {
  const originalPromisesReadlink = fs.promises.readlink.bind(fs.promises);
  fs.promises.readlink = async function patchedPromisesReadlink(...args) {
    try {
      return await originalPromisesReadlink(...args);
    } catch (error) {
      throw normalizeReadlinkError(error);
    }
  };
}
