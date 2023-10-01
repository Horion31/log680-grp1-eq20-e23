import("node-fetch");

const github_data = {
  token: "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",
  username: "Jean-Lamarre"
};

const { response } = require("express");

// https://github.com/ashutosh1919/github-graphql-api-tutorial/blob/master/git_data_fetcher.js

const query_pr = {
  query: `
      query {
        user(login: "${github_data.username}"){
          pullRequests(last: 10, orderBy: {field: CREATED_AT, direction: DESC}){
        totalCount
        nodes{
          id
          title
          url
          state
            mergedBy {
                avatarUrl
                url
                login
            }
            createdAt
            number
          changedFiles
            additions
            deletions
          baseRepository {
                name
                url
                owner {
                  avatarUrl
                  login
                  url
                }
              }
        }
      }
      }
  }
      `,
};

const query_issue = {
  query: `query{
        user(login: "Jean-Lamarre") {
        issues(last: 100, orderBy: {field:CREATED_AT, direction: DESC}){
        totalCount
        nodes{
            id
            closed
            title
            createdAt
          url
          number
          assignees(first:100){
            nodes{
              avatarUrl
              name
              url
            }
          }
          repository{
            name
            url
            owner{
              login
              avatarUrl
              url
            }
          }
        }
      }
    }
      }`,
};

const query_org = {
  query: `query{
      user(login: "${github_data.username}") {
          repositoriesContributedTo(last: 100){
            totalCount
            nodes{
              owner{
                login
                avatarUrl
                __typename
              }
            }
          }
        }
      }`,
};

const baseUrl = "https://api.github.com/graphql";

const headers = {
  "Content-Type": "application/json",
  Authentication: "bearer " + github_data.token
};

fetch(baseUrl, {
  method: "POST",
  headers: headers,
  body: JSON.stringify(query_issue)
})
  .then((response) => response.text())
  .then((txt) => {
    const data = JSON.parse(txt);
    var cropped = { data: [] };
    cropped["data"] = data["data"]["user"]["issues"]["nodes"];

    var open = 0;
    var closed = 0;
    for (var i = 0; i < cropped["data"].length; i++) {
      if (cropped["data"][i]["closed"] === false) open++;
      else closed++;
    }

    cropped["open"] = open;
    cropped["closed"] = closed;
    cropped["totalCount"] = cropped["data"].length;

    console.log("Fetching the Issues Data.\n");
    fs.writeFile(
      "./src/shared/opensource/issues.json",
      JSON.stringify(cropped),
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );
  })
  .catch((error) => console.log(JSON.stringify(error)));