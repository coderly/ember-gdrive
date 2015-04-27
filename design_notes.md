# create file

`'?state=%7B%22folderId%22:%220AMftiYAzT3YQUk9PVA%22,%22action%22:%22create%22,%22userId%22:%22#{user_id}%22%7D'`

* When you login using one of the demo apps (storypad ot todoMVC, there will be a network request titled userInfo, which contains the user id)

# open file
`'?state=%7B%22ids%22:%5B%22{document_id_goes_here}%22%5D,%22action%22:%22open%22,%22userId%22:%22#{user_id}%22%7D'`

* If you don't have a specific document to open, then creating a new one will give you an id
