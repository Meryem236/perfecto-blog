/**
 * Class for  handling a list (an array) of visitor opinions in local storage
 * The list is filled from a form and rendered to html
 * A template literal is used to render the opinions list
 * @author Stefan Korecko (2021)
 * 
 * 
 * 
 */
export default function processOpnFrmData(event){
    event.preventDefault();

    const form = event.target;

const nopName = form.elements["opnElm"].value.trim();
const nopOpn = form.elements["nopOpn"].value.trim();
const nopFeedback = form.elements["feedback"].value.trim();
const nopWillReturn = form.elements["willReturnElm"].checked;
const nopPicture = form.elements["picture"].value.trim() || "fig/profile.png";
   
    //3. Verify the data
    if(nopName=="" || nopOpn==""||nopFeedback === ""){
        window.alert("Please, enter both your name and opinion");
        return;
    }
    if (!nopPicture) {
        nopPicture = "fig/profile.png";
    }

    //3. Add the data to the array opinions and local storage
    const newOpinion =
        {
            name: nopName,
            email: nopOpn,
            comment: nopFeedback,
            willReturn: nopWillReturn,
            created: new Date(),
            picture: nopPicture,
            
        };

        let opinions = [];

if(localStorage.myTreesComments){
    opinions=JSON.parse(localStorage.myTreesComments);
}

opinions.push(newOpinion);
localStorage.myTreesComments = JSON.stringify(opinions);


//5. Go to the opinions
window.location.hash="#opinions";

}





