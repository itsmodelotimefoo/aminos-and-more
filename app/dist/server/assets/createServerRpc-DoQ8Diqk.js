import { a2 as TSS_SERVER_FUNCTION } from "./server-Bj_kDYFo.js";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
export {
  createServerRpc as c
};
