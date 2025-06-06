import React, { useState } from "react";
import { Heading } from "../components/Heading"
import { SubHeading } from "../Components/SubHeading";
import { InputBox } from "../Components/InputBox";
import { Button } from "../Components/Button";
import { BottomWarning } from "../Components/BottomWarning";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Signup = () => {

   const [firstName, setFirstName] = useState("");
   const [lastName, setLastName] = useState("");
   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");

   const navigate = useNavigate()

   return <div className="bg-slate-300 h-screen flex justify-center">
        <div className="flex flex-col justify-center">
         <div className="rounded-lg bg-white text-center p-2 w-80 h-max px-4 ">
             <Heading label={"Sign up"} />
             <SubHeading label={"Enter your information to create an account"} />

             <InputBox onChange={e => {
                 setFirstName(e.target.value);
             }} placeholder={"John"} label={"First Name"}/>

             <InputBox onChange={e => {
                  setLastName(e.target.value);
             }} placeholder={"Doe"} label={"Last Name"}/>

             <InputBox onChange={e => {
                  setUsername(e.target.value);
             }} placeholder={"pathanrehan@gmail.com"} label={"Email"}/> 

             <InputBox onChange={e => {
                  setPassword(e.target.value);
             }} placeholder={"123456"} label={"Password"}/>
 
            <div className="pt-4">
               <Button onClick={async () => {
                  const response = await axios.post("http://localhost:4000/api/v1/user/signup", {
                     username,
                     password,
                     firstName,
                     lastName
                  })
                  navigate("/dashboard");
                  localStorage.setItem("token",response.data.token)
               }} label={"Sign up"} />
            </div>
            <BottomWarning label={"Already have an account?"} buttonText={"Sign in"} to={"/signin"}/>
         </div>
        </div>
   </div>
}
