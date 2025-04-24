import React from "react";
import { Appbar } from "../Components/Appbar";
import { Balance } from "../Components/Balance";
import { Users } from "../Components/Users";

export const Dashboard = () => {
   return <div>
        <div>
           <Appbar />
           <div className="m-8">
              <Balance value={"10,000"} />
              <Users />
           </div>
        </div>
   </div>
}
