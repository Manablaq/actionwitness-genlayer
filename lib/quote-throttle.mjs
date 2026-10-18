/** In-process burst protection only. An edge/global limiter is required for unrestricted public use. */
const WINDOW_MS=60000, MAX_PER_WINDOW=8;
const hits=[];
export function quotePermit(now=Date.now()) {
  if(!Number.isSafeInteger(now)||now<0)throw Error('Invalid throttle time.');
  while(hits.length && hits[0] <= now-WINDOW_MS) hits.shift();
  if(hits.length>=MAX_PER_WINDOW)return false;
  hits.push(now);
  return true;
}
export function newQuoteThrottle({windowMs=WINDOW_MS,max=MAX_PER_WINDOW}={}) {
  const history=[];
  return (now)=>{
    while(history.length && history[0]<=now-windowMs)history.shift();
    if(history.length>=max)return false;
    history.push(now);return true;
  };
}
