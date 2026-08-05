-- Custom SQL migration file, put your code below! --
UPDATE `workspace_invites` SET `token` = lower(hex(randomblob(16))) WHERE `token` IS NULL;