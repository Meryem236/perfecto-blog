/*
 * routes definition and handling for paramHashRouter
 */

import Mustache from "./mustache.js";
import processOpnFrmData from "./opinionsHandler.js";
import articleFormsHandler from "./articleFormsHandler.js";




//an array, defining the routes
export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },
    {
        hash:"articles",
        target:"router-view",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },
    {
        hash:"addOpinion",
        target:"router-view",
        getTemplate: (targetElm) =>{
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML;
            document.getElementById("opnFrm").onsubmit=processOpnFrmData;
        }
    },
    {
        hash:"article",
        target:"router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },
    {
        hash:"artEdit",
        target:"router-view",
        getTemplate: editArticle
    },
    {
        hash:"artDelete",
        target:"router-view",
        getTemplate: deleteArticle
    },
    { 
        hash:"articleComments", 
        target:"comments-view", 
        getTemplate: fetchAndDisplayArticleComments
    }
    
];       

const urlBase = "https://wt.kpi.fei.tuke.sk/api";

function createHtml4opinions(targetElm) {
    const opinionsFromStorage = localStorage.myTreesComments;
    let opinions = [];

    if (opinionsFromStorage) {
        opinions = JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn =
                opinion.willReturn ? "I will return to this page." : "Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}
     

export function fetchAndDisplayArticles(targetElm, offsetFromHash = 0, totalCountFromHash = 0, newArticle = null) {
    const offset = Number(offsetFromHash);
    const totalCount = Number(totalCountFromHash);
    const articlesPerPage = 10; 

    let urlQuery = `?max=${articlesPerPage}`;
    if (offset) {
        urlQuery += `&offset=${offset}`;
    }

    const uniqueTag = 'fashion';
    urlQuery += `&tag=${encodeURIComponent(uniqueTag)}`;

    const url = `${urlBase}/articles${urlQuery}`;

    function reqListener() {
        if (this.status === 200) {
            const responseJSON = JSON.parse(this.responseText);

            // If totalCount is not provided, use the length of the articles array
            const totalArticles = totalCount > 0 ? totalCount : responseJSON.meta.totalCount || responseJSON.articles.length;

            addArtDetailLink2ResponseJson(responseJSON);

            // Fetch the full article content for each article
            const articles = responseJSON.articles;
            const promises = articles.map(article => 
                fetch(`${urlBase}/article/${article.id}`)
                    .then(response => response.json())
                    .then(fullArticle => {
                        article.content = fullArticle.content;
                        return article;
                    })
            );

            Promise.all(promises).then(updatedArticles => {
                responseJSON.articles = updatedArticles;

                // If a new article is provided, prepend it to the articles list
                if (newArticle) {
                    responseJSON.articles.unshift(newArticle);
                }

                responseJSON.showPrevious = offset > 0;
                responseJSON.showNext = (offset + articlesPerPage) < totalArticles;
                responseJSON.previousOffset = Math.max(0, offset - articlesPerPage);
                responseJSON.nextOffset = offset + articlesPerPage;
                responseJSON.totalCount = totalArticles;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-articles").innerHTML,
                        responseJSON
                    );
            });
        } else {
            const errMsgObj = { errMessage: this.responseText };
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        }
    }

    const ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("GET", url, true);
    ajax.send();
}




function deleteArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    function reqListener() {
        console.log("Server response:", this.responseText); // Log the server response
        console.log("Status code:", this.status); // Log the status code
        
        if (this.status == 200 || this.status == 204) { // Handle 204 status as success
            alert("Article deleted successfully!");
            window.location.hash = `#articles/${offsetFromHash}/${totalCountFromHash}`; 
            fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash);
        } else {
            console.error("Error deleting article: ", this.responseText); // Log the error for debugging
            const errMsgObj = { errMessage: this.responseText };
            document.getElementById(targetElm).innerHTML = Mustache.render(
                document.getElementById("template-articles-error").innerHTML,
                errMsgObj
            );
        }
    }

    if (confirm("Are you sure you want to delete this article?")) {
        var ajax = new XMLHttpRequest();
        ajax.addEventListener("load", reqListener);
        ajax.open("DELETE", url, true);
        ajax.send();
    }

}





function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles = responseJSON.articles.map(
      article =>(
       {
         ...article,
         detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
       }
      )
    );
  }                                      

  function fetchAndDisplayArticleDetail(targetElm,artIdFromHash,offsetFromHash,totalCountFromHash) {
    fetchAndProcessArticle(...arguments,false);
}                   



function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(...arguments,true);
}     

function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, forEdit) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    function reqListener() {
      // stiahnuty text
      console.log(this.responseText)
      if (this.status == 200) {
          const responseJSON = JSON.parse(this.responseText)
          if(forEdit){
              responseJSON.formTitle="Article Edit";
              responseJSON.submitBtTitle="Save article";
              responseJSON.backLink=`#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;
          
              document.getElementById(targetElm).innerHTML =
                  Mustache.render(
                      document.getElementById("template-article-form").innerHTML,
                      responseJSON
                  );
              if(!window.artFrmHandler){
                  window.artFrmHandler= new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
              }
              window.artFrmHandler.assignFormAndArticle("articleForm","hiddenElm",artIdFromHash,offsetFromHash,totalCountFromHash);
             } else {
                responseJSON.backLink = `#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink = `#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink = `#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML = Mustache.render(
                    document.getElementById("template-article").innerHTML,
                    responseJSON
                );

                // Handle comments
                const existingComments = JSON.parse(localStorage.getItem(`comments-${artIdFromHash}`)) || [];
                let offset = 0;
                const limit = 10;

                // Initial render
                renderComments(existingComments, offset, limit);

                // Pagination event listeners
                document.getElementById("prevBtn").onclick = function () {
                    offset = Math.max(0, offset - limit);
                    renderComments(existingComments, offset, limit);
                };

                document.getElementById("nextBtn").onclick = function () {
                    if (offset + limit < existingComments.length) {
                        offset += limit;
                        renderComments(existingComments, offset, limit);
                    }
                };

                // Add comment submission logic
                const commentForm = document.getElementById("add-comment-form");
                const addCommentBtn = document.getElementById("add-comment-btn");

                // Toggle the form visibility on button click
                if (addCommentBtn) {
                    addCommentBtn.onclick = function () {
                        commentForm.classList.toggle("hiddenElm");
                    };
                }

                if (commentForm) {
                    commentForm.onsubmit = function (e) {
                        e.preventDefault();
                        const author = document.getElementById("comment-author").value;
                        const content = document.getElementById("comment-content").value;

                        const newComment = { author, content, date: new Date().toISOString() };

                        // Save new comment in localStorage
                        existingComments.push(newComment);
                        localStorage.setItem(`comments-${artIdFromHash}`, JSON.stringify(existingComments));

                        // Update the UI
                        renderComments(existingComments, offset, limit);

                        // Reset the form
                        commentForm.reset();
                    };
                }
            }
        } else {
            const errMsgObj = { errMessage: this.responseText };
            document.getElementById(targetElm).innerHTML = Mustache.render(
                document.getElementById("template-articles-error").innerHTML,
                errMsgObj
            );
        }
    }

    var ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("GET", url, true);
    ajax.send();
}

// Helper function to render comments
function renderComments(comments, offset = 0, limit = 10) {
    const paginatedComments = comments.slice(offset, offset + limit);
    const hasNext = offset + limit < comments.length;
    const hasPrev = offset > 0;

    document.getElementById("comments-container").innerHTML = Mustache.render(
        "{{#comments}}<div class='comment'><strong>{{author}}</strong> <em>{{date}}</em><p>{{content}}</p></div>{{/comments}}",
        { comments: paginatedComments }
    );

    // Show or hide pagination buttons
    document.getElementById("prevBtn").classList.toggle("hiddenElm", !hasPrev);
    document.getElementById("nextBtn").classList.toggle("hiddenElm", !hasNext);
}

function handleAddCommentFormSubmit(event, artIdFromHash) {
    event.preventDefault();
    const content = form.querySelector("[name='content']").value.trim();
    const author = form.querySelector("[name='author']").value.trim() || "Anonymous";

    if (!content) {
        alert("Please enter a comment.");
        return;
    }

    // Comment data payload
    const commentData = {
        content,
        author
    };

    // POST request to add the comment
    fetch(`${urlBase}/article/${artIdFromHash}/comments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(commentData)
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Failed to add the comment.");
        })
        .then(() => {
            alert("Comment added successfully!");
            // Reload comments after adding
            fetchAndDisplayArticleComments("comments-container", artIdFromHash, 0, 10);
            form.reset(); // Clear the form fields
        })
        .catch((error) => {
            console.error("Error adding comment:", error);
            alert("Failed to add comment. Please try again.");
        });
}

function fetchAndDisplayArticleComments(targetElm, artIdFromHash, offset = 0, limit = 10) {
    fetch(`${urlBase}/article/${artIdFromHash}/comments?offset=${offset}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            renderComments(data.comments, offset, limit);

            // Pagination buttons logic
            document.getElementById("prevBtn").onclick = function () {
                fetchAndDisplayArticleComments(targetElm, artIdFromHash, Math.max(0, offset - limit), limit);
            };
            document.getElementById("nextBtn").onclick = function () {
                if (data.comments.length === limit) {
                    fetchAndDisplayArticleComments(targetElm, artIdFromHash, offset + limit, limit);
                }
            };
        })
        .catch(error => console.error("Failed to fetch comments:", error));
}