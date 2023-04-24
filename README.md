# 💬 cryptic.js

![npm](https://img.shields.io/npm/dm/crypticjs?style=flat-square) ![npm](https://img.shields.io/npm/v/crypticjs?label=latest%20version&style=flat-square) ![GitHub](https://img.shields.io/github/license/notreeceharris/cryptic.js?style=flat-square)

This Node.js application is an end-to-end encrypted chat system that ensures secure communication between users. The application uses encryption techniques to protect messages in transit and storage, preventing unauthorized access. Users can exchange messages with confidence, knowing that their communication is secure and protected.

 <details>

  <summary>Screenshots</summary>
  <br>

 ![](https://github.com/NotReeceHarris/NotReeceHarris/blob/main/cdn/crypticjs-ngrok-1.2.0.png?raw=true)

</details> 

## Installation

Installing Cryptic js is a straightforward process. First, ensure that you have [Node.js](https://nodejs.org/) version `12.x` or higher and a node package manager (such as [NPM](https://www.npmjs.com/)) installed on your system.

To install Cryptic js, open your terminal or command prompt and enter the following command:

```
npm i -g crypticjs@latest
```

This command will install Cryptic js globally on your system, making it available to use from any directory.

After installation, you can confirm that Cryptic js is working correctly by running the following command in your terminal:

```
crypticjs --version
```

This should display the version number of Cryptic js that you just installed.

## Usage

Using Cryptic js is a simple process. To get started, open a terminal or command prompt and enter the following command:

```
crypticjs
```

This command will start Cryptic js and prompt you to enter the listening port, host's IP address, and port number.

### Using ngrok

Using ngrok to create a secure TCP tunnel is a great way to enhance your security and privacy by hiding your IP address. It also eliminates the need to port forward your device, making it much easier to use Cryptic js.

To set up an TCP tunnel on port `X` using ngrok, follow these steps:

1. Download and install ngrok from the official website: https://ngrok.com/download.
2. Extract the downloaded file and navigate to the folder containing the ngrok executable. 
3. Open a terminal or command prompt and navigate to the folder containing the ngrok executable. 
4. Type the following command to start a secure TCP tunnel on port X: 
    
```
ngrok TCP X
```

Replace `X` with the port number you want to use. This will create a public URL that you can use to access your local server securely.

- Once the TCP tunnel is created, copy the public URL provided by ngrok.
- Start Cryptic js and enter the ngrok URL when prompted for the host's IP address and port number.

Note: If you are using Cryptic js version `1.2.x` or higher, you can set up ngrok automatically by running the following command instead of the crypticjs command:

```
crypticjs --ngrok
```

## Disclaimer

Using Cryptic js can enhance your security and privacy, but it is not a guarantee of complete security. While Cryptic js uses proven and effective algorithms to secure your communication line, it is important to remember that **no system is 100% secure**.

In addition, to maintain the highest level of security and privacy, it is important to practice good operational security (OPSEC). This includes using strong passwords, keeping your software up-to-date, and avoiding sharing sensitive information over public networks or unsecured channels.

Cryptic js is designed to help you protect your communications, but it is ultimately up to you to ensure that you are taking all necessary steps to maintain your security and privacy.
