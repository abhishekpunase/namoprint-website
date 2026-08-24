import { signMediaInJson } from '../services/storage.service.js';

/** Rewrite stored S3 object URLs in API JSON to short-lived signed GET URLs. Skip PUT uploadUrl. */
export function attachSignedMediaJson(req, res, next) {
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    Promise.resolve(signMediaInJson(body))
      .then((signed) => sendJson(signed))
      .catch(next);
  };
  next();
}
