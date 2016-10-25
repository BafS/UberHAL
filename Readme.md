# UberHAL

A one night chatbot experiment, using Markov Chains, for fun.

## Usage

```bash
node main <action> [options]
```

 - Speak: `node main speak`
 - Learn: `node main learn ./a_file.txt`
   - You can pass a parser to clean the input file like `node main learn ./my_movie.sub subtitle` (check the parsers/ folder to list the parsers)
 - Answer: `node main answer 'Are you lost ?'`
 - Clear: `node main clear` to reset the database
