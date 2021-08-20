import os

print('Installing Modules...')
print('')

os.system('npm install')

print('')
print('Creating run file...')
print('')

if (os.path.exists('run.cmd')):

    print('')
    print('Removing existing run.cmd')
    print('')
    os.remove('run.cmd')

print('')
print('Creating run.cmd file')
print('')

fs = open('run.cmd', 'w')
fs.write("@echo off\nnode index.js")
fs.close()

print('')
print('Deleting current file...')
print('')
os.remove(os.path.basename(__file__))

print('')
print('Finish!')
print('')