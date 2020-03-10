import fs from 'fs'
import yaml from 'js-yaml'

const config = yaml.safeLoad(fs.readFileSync('env.yml'), 'utf-8')

Object.assign(process.env, config.dev)
