const query_issue = {
    query: `query {
        repository(owner:"Horion31", name:"log680-grp1-eq20-e23") {
          issues(last:20, states:OPEN) {
            edges {
              node {
                title
                url
                labels(first:5) {
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }`,
};
