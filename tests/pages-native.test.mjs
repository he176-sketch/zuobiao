import test from "node:test";
import assert from "node:assert/strict";
import { createPagesHandler } from "../deploy/pages/handler.mjs";
const origin="https://yuechengai.pages.dev";
const request=(path, init={})=>new Request(origin+path,init);
const noCall={fetch(){throw Error("Unexpected handler invocation");}};

test("Pages denies untrusted writes and private routes before application code",async()=>{
 const worker=createPagesHandler(noCall);
 for(const path of ["/api/chat","/api/trial"]){
  for(const value of [undefined,"null","https://other.example"]){
   assert.equal((await worker.fetch(request(path,{method:"POST",headers:value?{origin:value}:{}}),{})).status,403);
  }
 }
 for(const path of ["/.env","/docs/CONTROL.md","/api/admin","/_worker.js/app/index.js","/callback","/signin-with-chatgpt","/_next/static/private.js.map"]){
  assert.equal((await worker.fetch(request(path),{})).status,404);
 }
 assert.equal((await worker.fetch(request("/api/chat?code=mock-code"),{})).status,400);
 assert.equal((await worker.fetch(request("/"),{SITE_PUBLIC_ENABLED:"false"})).status,503);
});

test("Pages calls local application with original origin and trial cookie only",async()=>{
 let calls=0;
 const worker=createPagesHandler({async fetch(req, env){
  calls++;assert.equal(req.url,origin+"/api/chat");assert.equal(req.headers.get("origin"),origin);
  assert.equal(req.headers.get("cookie"),"__Host-zuobiao-trial=mock-code");
  for(const key of ["authorization","oai-authenticated-user-id","x-forwarded-host"])assert.equal(req.headers.get(key),null);
  assert.equal(await req.text(),"{}");assert.equal(env.DB,"local-binding");
  return Response.json({error:"schema"},{status:400});
 }});
 const reply=await worker.fetch(request("/api/chat",{method:"POST",body:"{}",headers:{origin,"content-type":"application/json",cookie:"personal=secret; __Host-zuobiao-trial=mock-code",authorization:"Bearer secret","oai-authenticated-user-id":"owner","x-forwarded-host":"elsewhere"}}),{DB:"local-binding"});
 assert.equal(calls,1);assert.equal(reply.status,400);assert.equal(reply.headers.get("cache-control"),"no-store");
});

test("Pages routes application assets and licenses to local ASSETS",async()=>{
 const worker=createPagesHandler(noCall);
 for(const path of ["/favicon.svg","/_next/static/chunks/app.js","/knowledge/licenses/model-thinking.txt","/knowledge/licenses/philoscopia.txt"]){
  const r=await worker.fetch(request(path),{ASSETS:{fetch(req){assert.equal(req.url,origin+path);return new Response("asset");}}});
  assert.equal(await r.text(),"asset");
 }
});

test("Pages retains API statuses and cookie flags without remote website fetch",async()=>{
 for(const status of [200,401,429,503]){
  const cookie="__Host-zuobiao-trial=mock-code; Path=/; HttpOnly; Secure; SameSite=Strict";
  const w=createPagesHandler({fetch:async()=>Response.json({status},{status,headers:{"set-cookie":cookie}})});
  const r=await w.fetch(request("/api/chat"),{});
  assert.equal(r.status,status);assert.equal(r.headers.get("set-cookie"),cookie);
 }
});
