# xPossible
It’s a real-world challenge recently discovered by [Amirsafari](https://x.com/amirmsafari). We’ve been testing this case for six months across many programs—it’s about how to turn a Self-XSS into a valid XSS during exploitation. Today, we decided to share it in the form of a challenge to keep the engagement high. Thanks!

## Installation
Run the following command to deploy the challenge:
```bash
docker compose up -d
```

## Rules and Objective
1. Use `user:pass` and `admin:h4rdPass` for login
2. As user, send administrator a link and steal their API key
3. Do not host the exploit code on the challenge domain
