# xPossible
It’s a real-world challenge recently discovered by [Amirsafari](https://x.com/amirmsafari). We’ve been testing this case for six months across many programs—it’s about how to turn a Self-XSS into a valid XSS during exploitation. Today, we decided to share it in the form of a challenge to keep the engagement high. Thanks!

## Installation
Run the following command to deploy the challenge:
```bash
docker compose up -d
```

### Fix SQLite Write Permissions (Important)

If you see an error like:

```
Warning: SQLite3Stmt::execute(): Unable to execute statement: attempt to write a readonly database
```

It means the SQLite database file cannot be written to because of incorrect file permissions.

Run the following commands to fix it:

```bash
sudo chmod -R 777 ./src
```


## Rules and Objective
1. Use `user:pass` and `admin:h4rdPass` for login
2. As user, send administrator a link and steal their API key
3. Do not host the exploit code on the challenge domain



<details>
  <summary>Toggle to see the solution</summary>
  
  > Solution : [@AmirMSafari](https://x.com/AmirMSafari/status/1916915952723394769)
</details>
