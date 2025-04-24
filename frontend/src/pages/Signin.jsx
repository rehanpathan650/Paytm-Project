import React from "react";
import {Heading} from "../components/Heading"
import { SubHeading } from "../Components/SubHeading";
import { InputBox } from "../Components/InputBox";
import { Button } from "../Components/Button";
import { BottomWarning } from "../Components/BottomWarning";

export const Signin = () => {
   return <div className="bg-slate-300 h-screen flex justify-center">
        <div className="flex flex-col justify-center">
         <div className="rounded-lg bg-white text-center p-2 w-80 h-max px-4 ">
             <Heading label={"Sign in"} />
             <SubHeading label={"Enter your credentials to access your account"} />
             <InputBox placeholder={"pathanrehan@gmail.com"} label={"Email"}/>
             <InputBox placeholder={"123456"} label={"Password"}/>
            <div className="pt-4">
               <Button onClick={() => {
                                 axios.post("http://localhost:4000/api/v1/user/signup", {
                                    username,
                                    password,
                                    firstName,
                                    lastName
                                 })
                              }} label={"Sign in"} />
            </div>
            <BottomWarning label={"Don't have an account?"} buttonText={"Sign up"} to={"/signup"}/>
         </div>
        </div>
   </div>
}
