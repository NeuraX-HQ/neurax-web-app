import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  TransactWriteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'node:crypto';

const REGION = process.env.AWS_REGION || 'ap-southeast-2';
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Cache table names
let userTableName: string | null = null;
let friendshipTableName: string | null = null;

async function discoverTables(): Promise<{ userTable: string; friendshipTable: string }> {
  if (userTableName && friendshipTableName) {
    return { userTable: userTableName, friendshipTable: friendshipTableName };
  }

  // Paginate ListTables — API returns max 100 per call
  const tables: string[] = [];
  let lastEvaluated: string | undefined;
  do {
    const result = await client.send(new ListTablesCommand({
      ExclusiveStartTableName: lastEvaluated,
    }));
    tables.push(...(result.TableNames || []));
    lastEvaluated = result.LastEvaluatedTableName;
  } while (lastEvaluated);

  const uTable = tables.find((n: string) => n.startsWith('user-'));
  const fTable = tables.find((n: string) => n.startsWith('Friendship-'));

  if (!uTable) throw new Error('user table not found in DynamoDB');
  if (!fTable) throw new Error('Friendship table not found in DynamoDB');

  userTableName = uTable;
  friendshipTableName = fTable;
  return { userTable: uTable, friendshipTable: fTable };
}

// ─── Actions ───

type FriendAction = 'sendRequest' | 'acceptRequest' | 'declineRequest' | 'removeFriend' | 'blockFriend';

interface HandlerEvent {
  arguments: {
    action: FriendAction;
    payload: string;
  };
  identity?: {
    sub?: string;
    username?: string;
    claims?: { sub?: string; 'cognito:username'?: string };
  };
}

interface CallerIdentity {
  sub: string;
  owner: string; // Amplify owner format: "sub::cognitoUsername"
}

function getCallerIdentity(event: HandlerEvent): CallerIdentity {
  const sub = event.identity?.sub || event.identity?.claims?.sub;
  if (!sub) throw new Error('Unauthorized: no user identity');
  const username = event.identity?.username
    || event.identity?.claims?.['cognito:username']
    || sub;
  return { sub, owner: `${sub}::${username}` };
}

export const handler = async (event: HandlerEvent): Promise<string> => {
  const { action, payload } = event.arguments;
  const caller = getCallerIdentity(event);
  const params = JSON.parse(payload || '{}');

  try {
    switch (action) {
      case 'sendRequest':
        return JSON.stringify(await sendRequest(caller, params.friend_code));
      case 'acceptRequest':
        return JSON.stringify(await acceptRequest(caller, params.friendship_id));
      case 'declineRequest':
        return JSON.stringify(await declineRequest(caller, params.friendship_id));
      case 'removeFriend':
        return JSON.stringify(await removeFriend(caller, params.friendship_id));
      case 'blockFriend':
        return JSON.stringify(await blockFriend(caller, params.friendship_id));
      default:
        return JSON.stringify({ success: false, error: `Unknown action: ${action}` });
    }
  } catch (error: any) {
    console.error(`[FRIEND] ${action} error:`, error);
    return JSON.stringify({ success: false, error: error.message || 'Internal error' });
  }
};

// ─── sendRequest ───
// Caller enters a friend_code → lookup user → create 2 Friendship records

async function sendRequest(caller: CallerIdentity, friendCode: string) {
  if (!friendCode) throw new Error('friend_code is required');

  const { userTable, friendshipTable } = await discoverTables();

  // 1. Lookup friend by friend_code
  const friendUser = await findUserByFriendCode(userTable, friendCode);

  if (!friendUser) throw new Error('Không tìm thấy người dùng với mã này');
  if (friendUser.user_id === caller.sub) throw new Error('Không thể kết bạn với chính mình');

  // 2. Get caller's profile for display name
  const callerUser = await getUserById(userTable, caller.sub);
  if (!callerUser) throw new Error('Caller profile not found');

  // 3. Check for existing friendship (no duplicates)
  const existing = await findExistingFriendship(friendshipTable, caller.owner, friendUser.user_id);
  if (existing) {
    if (existing.status === 'accepted') throw new Error('Đã là bạn bè rồi');
    if (existing.status === 'pending') throw new Error('Đã gửi lời mời rồi');
    if (existing.status === 'blocked') throw new Error('Không thể gửi lời mời');
  }

  // 4. Check pending limit (max 20)
  const pendingCount = await countPendingRequests(friendshipTable, caller.owner);
  if (pendingCount >= 20) throw new Error('Đã đạt giới hạn 20 lời mời đang chờ');

  // 5. Get friend's Amplify owner identity from their user record
  // Amplify sets owner as "sub::cognitoUsername" — read it directly from DB
  const friendOwner = friendUser.owner;
  if (!friendOwner) throw new Error('Friend user record missing owner field');

  // 6. Create 2 Friendship records atomically
  const now = new Date().toISOString();
  const sentId = randomUUID();
  const receivedId = randomUUID();

  await docClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Put: {
          TableName: friendshipTable,
          Item: {
            id: sentId,
            owner: caller.owner,
            friend_id: friendUser.user_id,
            friend_code: friendCode,
            friend_name: friendUser.display_name || friendUser.email || 'User',
            friend_avatar: friendUser.avatar_url || null,
            status: 'pending',
            direction: 'sent',
            linked_id: receivedId,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
      {
        Put: {
          TableName: friendshipTable,
          Item: {
            id: receivedId,
            owner: friendOwner,
            friend_id: caller.sub,
            friend_code: callerUser.friend_code || '',
            friend_name: callerUser.display_name || callerUser.email || 'User',
            friend_avatar: callerUser.avatar_url || null,
            status: 'pending',
            direction: 'received',
            linked_id: sentId,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    ],
  }));

  return {
    success: true,
    friend_name: friendUser.display_name || friendUser.email,
    friendship_id: sentId,
  };
}

// ─── acceptRequest ───
// Caller accepts a received request → update both records to accepted

async function acceptRequest(caller: CallerIdentity, friendshipId: string) {
  if (!friendshipId) throw new Error('friendship_id is required');

  const { friendshipTable } = await discoverTables();

  // 1. Get the received record
  const receivedRecord = await getFriendshipById(friendshipTable, friendshipId);
  if (!receivedRecord) throw new Error('Friendship record not found');

  // Verify the caller owns this record (compare sub part of owner)
  const ownerSub = receivedRecord.owner?.split('::')[0];
  if (ownerSub !== caller.sub) throw new Error('Unauthorized');
  if (receivedRecord.direction !== 'received') throw new Error('Can only accept received requests');
  if (receivedRecord.status !== 'pending') throw new Error('Request is not pending');

  const linkedId = receivedRecord.linked_id;
  if (!linkedId) throw new Error('Linked friendship record not found');

  // 2. Update both records atomically
  const now = new Date().toISOString();

  await docClient.send(new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: friendshipTable,
          Key: { id: friendshipId },
          UpdateExpression: 'SET #s = :status, updatedAt = :now',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':status': 'accepted', ':now': now },
        },
      },
      {
        Update: {
          TableName: friendshipTable,
          Key: { id: linkedId },
          UpdateExpression: 'SET #s = :status, updatedAt = :now',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':status': 'accepted', ':now': now },
        },
      },
    ],
  }));

  return { success: true };
}

// ─── declineRequest ───

async function declineRequest(caller: CallerIdentity, friendshipId: string) {
  if (!friendshipId) throw new Error('friendship_id is required');

  const { friendshipTable } = await discoverTables();

  const record = await getFriendshipById(friendshipTable, friendshipId);
  if (!record) throw new Error('Friendship record not found');

  const ownerSub = record.owner?.split('::')[0];
  if (ownerSub !== caller.sub) throw new Error('Unauthorized');

  const linkedId = record.linked_id;

  // Delete both records
  const transactItems: any[] = [
    { Delete: { TableName: friendshipTable, Key: { id: friendshipId } } },
  ];
  if (linkedId) {
    transactItems.push({ Delete: { TableName: friendshipTable, Key: { id: linkedId } } });
  }

  await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));

  return { success: true };
}

// ─── removeFriend ───

async function removeFriend(caller: CallerIdentity, friendshipId: string) {
  // Same as decline — delete both records
  return declineRequest(caller, friendshipId);
}

// ─── blockFriend ───

async function blockFriend(caller: CallerIdentity, friendshipId: string) {
  if (!friendshipId) throw new Error('friendship_id is required');

  const { friendshipTable } = await discoverTables();

  const record = await getFriendshipById(friendshipTable, friendshipId);
  if (!record) throw new Error('Friendship record not found');

  const ownerSub = record.owner?.split('::')[0];
  if (ownerSub !== caller.sub) throw new Error('Unauthorized');

  const linkedId = record.linked_id;
  const now = new Date().toISOString();

  // Update caller's record to blocked, delete the other person's record
  const transactItems: any[] = [
    {
      Update: {
        TableName: friendshipTable,
        Key: { id: friendshipId },
        UpdateExpression: 'SET #s = :status, updatedAt = :now',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':status': 'blocked', ':now': now },
      },
    },
  ];
  if (linkedId) {
    transactItems.push({ Delete: { TableName: friendshipTable, Key: { id: linkedId } } });
  }

  await docClient.send(new TransactWriteCommand({ TransactItems: transactItems }));

  return { success: true };
}

// ─── Helpers ───

async function findUserByFriendCode(tableName: string, friendCode: string) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'usersByFriend_code',
      KeyConditionExpression: 'friend_code = :code',
      ExpressionAttributeValues: { ':code': friendCode },
      Limit: 1,
    }));
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch {
    return null;
  }
}

async function getUserById(tableName: string, userId: string) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { user_id: userId },
    }));
    return result.Item || null;
  } catch {
    return null;
  }
}

async function getFriendshipById(tableName: string, id: string) {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { id },
    }));
    return result.Item || null;
  } catch {
    return null;
  }
}

async function findExistingFriendship(tableName: string, callerOwner: string, friendSub: string) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: '#o = :owner AND friend_id = :fid',
      ExpressionAttributeNames: { '#o': 'owner' },
      ExpressionAttributeValues: {
        ':owner': callerOwner,
        ':fid': friendSub,
      },
    }));
    return result.Items?.[0] || null;
  } catch {
    return null;
  }
}

async function countPendingRequests(tableName: string, callerOwner: string) {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: '#o = :owner AND #s = :status AND direction = :dir',
      ExpressionAttributeNames: { '#o': 'owner', '#s': 'status' },
      ExpressionAttributeValues: {
        ':owner': callerOwner,
        ':status': 'pending',
        ':dir': 'sent',
      },
      Select: 'COUNT',
    }));
    return result.Count || 0;
  } catch {
    return 0;
  }
}
